const CNN = require('./lib/CNN');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/*const enum CATEGORIES {
	DESKTOP,
	WEBSITE,
	APP,
	GAME,
	MOVIE,
	IMAGE,
	TEXT,
	COUNT//determines number of categories
}*/
const CATEGORIES = 7;

const IMAGE_INFO = {
	width: 256,
	height: 256,
	channels: 3
};
const IMAGE_SIZE = IMAGE_INFO.width * IMAGE_INFO.height * IMAGE_INFO.channels;

const TRAIN_BATCH = 128;

const dataset_dir = path.join(__dirname, 'dataset');
const models_dir = path.join(__dirname, 'models');

/**
 * @param {boolean} condition
 * @param {string} error_msg
 * */
function assert(condition, error_msg) {
	if( !condition ) throw new Error(error_msg);
}

function readLabelValues() {
	let labels = fs.readFileSync(path.join(dataset_dir, 'labels.txt'), 'utf8');
	
	/** @type {string[]} */
	let files = [];
	/** @type {number[]} */
	let label_values = [];
	
	labels.split('\n').forEach((line, index) => {
		//eg.: image1337.jpeg = 1, 0, 0, 1, 1
		if( !line.match(/[^.]+\.(png|jpe?g|webp|gif)\s*=\s*(\d,?\s*)+/gi) )
			return;
		//NOTE: NO SPACES IN IMAGE NAMES ALLOWED
		let sides = line.replace(/\s/g, '').split('=');
		assert(sides.length === 2, 'Could not parse labels file correctly');
		
		let values = sides[1].split(',').map(v => parseInt(v)|0);
		assert(values.length === CATEGORIES,
			`Incorrect number of label values in line: ${index}`);
		
		files.push( path.join(dataset_dir, sides[0]) );
		label_values.push( ...values );
	});
	
	assert(files.length*CATEGORIES === label_values.length,
		`Number of label values must be ${CATEGORIES} times larger than number of files`);
	
	return {
		files, label_values: Uint8Array.from(label_values)
	};
}

/**
 * @param {string[]} images
 * @returns {Promise<Float32Array>}
 */
async function loadImagesData(images) {
	let data = new Float32Array(images.length * IMAGE_SIZE);//RGB array
	let data_i = 0;
	
	for(let img_path of images) {
		let img = sharp( img_path );
		let channels = (await img.metadata()).channels || 0;
		
		let buffer = await img.resize(IMAGE_INFO.width, IMAGE_INFO.height).raw().toBuffer();
		
		assert(buffer.length === channels*IMAGE_INFO.width*IMAGE_INFO.height,
			`Incorrect image size (${img_path})`);
		
		for(let i=0; i<buffer.length; i+=channels) {
			for(let c=0; c<IMAGE_INFO.channels; c++)
				data[data_i++] = buffer[i+c]/255.0;
		}
	}
	assert(data_i === data.length,'Image data has not been loaded correctly');
	
	return data;
}

/**
 * @param {LayersModel} model
 * @param {{files: string[], label_values: Uint8Array}} dataset
 * @param {number} start
 * @param {number} end
 * @param {DataSchema} test_data
 * @returns {Promise<void>}
 */
async function trainBatch(model, dataset, start, end, test_data) {
	const elements = end-start;
	
	// PREPARE TRAIN DATA
	const train_image_data = await loadImagesData( dataset.files.slice(start, end) );
	const train_label_values = dataset.label_values.slice(CATEGORIES*start, CATEGORIES*end);
	
	assert(train_image_data.length === elements*IMAGE_SIZE,
		'Train image data extracted incorrectly');
	assert(train_label_values.length === elements*CATEGORIES,
		'Train label values extracted incorrectly');
	
	const train_data = CNN.getDataTensors(
		train_image_data, train_label_values,
		elements, IMAGE_INFO, CATEGORIES
	);
	
	console.log(`Training batch of ${elements} elements`);
	await CNN.train(model, train_data, test_data, 100, TRAIN_BATCH);
	console.log('batch training complete');
	
	train_data.pixels.dispose();
	train_data.labels.dispose();
	
	// VALIDATE
	/** @type {number[]} */
	let prediction = Array.from( CNN.predict(model, test_data.pixels) );
	
	let expected_predictions = test_data.labels.dataSync();
	
	for(let i=0; i<expected_predictions.length; i+=CATEGORIES) {
		console.log(
			prediction.slice(i, i+CATEGORIES).map(v => v.toFixed(2)).join(', '),
			'\t|\t',
			expected_predictions.slice(i, i+CATEGORIES) .join(', ')
		);
	}
}

async function train() {
	// LOAD DATASET LABEL VALUES AND FILE NAMES
	let dataset = readLabelValues();
	const elements = dataset.files.length;
	const test_elements = Math.min(100, (elements * 0.1)|0);
	const train_elements = elements - test_elements;
	console.log('train elements:', train_elements, '| test elements:', test_elements);
	
	// SHUFFLE DATASET, TODO: do not shuffle train data
	const indices = CNN.createShuffledIndices(dataset.files.length);
	assert(indices.length === dataset.files.length, 'Incorrect ');
	
	/** @type {string[]} */
	let shuffled_files = new Array(dataset.files.length);
	let shuffled_label_values = new Uint8Array(dataset.label_values.length);
	for(let i=0; i<indices.length; i++) {
		let idx = indices[i];
		shuffled_files[i] = dataset.files[idx];
		shuffled_label_values.set(
			dataset.label_values.slice(CATEGORIES*idx, CATEGORIES*(idx+1)),
			i*CATEGORIES
		);
	}
	dataset = {
		files: shuffled_files,
		label_values: shuffled_label_values
	};
	
	// PREPARE TEST DATA
	const test_image_data = await loadImagesData( dataset.files.slice(train_elements) );
	const test_label_values = dataset.label_values.slice(CATEGORIES*train_elements);
	
	assert(test_image_data.length === test_elements*IMAGE_SIZE,
		'Test image data extracted incorrectly');
	assert(test_label_values.length === test_elements*CATEGORIES,
		'Test label values extracted incorrectly');
	
	const test_data = CNN.getDataTensors(
		test_image_data, test_label_values,
		test_elements, IMAGE_INFO, CATEGORIES
	);
	
	// LOAD OR BUILD MODEL FOR TRAINING
	//const model = CNN.buildModel(IMAGE_INFO, CATEGORIES);
	const model = await CNN.loadModel( path.join(models_dir, 'screenshot_classification', 'model.json') );
	
	
	// CALCULATE BATCH ACCORDING TO SOME MEMORY LIMIT
	const max_memory_for_batch = 256 * 1024 * 1024;//256 MiB
	const memory_per_image = IMAGE_SIZE*4;//4 bytes for Float32
	const data_batch = Math.min(train_elements, (max_memory_for_batch / memory_per_image)|0 );
	const minimum_batch = Math.min(data_batch, TRAIN_BATCH);//no point of training less elements
	
	// TRAIN EACH BATCH OF DATA
	for(let start=0; start<train_elements; start+=data_batch) {
		let end = Math.min(train_elements, start+data_batch);
		if(end-start < minimum_batch)
			continue;
		await trainBatch(model, dataset, start, end, test_data);
	}
	
	// SAVE MODEL AND DISPOSE BUFFERS
	await model.save( 'file://' + path.join(models_dir, 'screenshot_classification') );
	model.dispose();
	
	test_data.pixels.dispose();
	test_data.labels.dispose();
}

train().catch(console.error);