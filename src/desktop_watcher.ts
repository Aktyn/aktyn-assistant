import * as CNN from './CNN';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const enum CATEGORIES {
	TRIANGLE,
	SQUARE,
	CIRCLE,
	COUNT//determines number of categories
}

const IMAGE_INFO = {
	width: 28,
	height: 28,
	channels: 1
};
const IMAGE_SIZE = IMAGE_INFO.width * IMAGE_INFO.height * IMAGE_INFO.channels;

const dataset_dir = path.join(__dirname, '..', 'dataset');
const models_dir = path.join(__dirname, '..', 'models');

function readLabelValues() {
	let labels = fs.readFileSync(path.join(dataset_dir, 'labels.txt'), 'utf8');
	
	return labels.split('\n').map(line => {
		return line.replace(/\/\/.*/g, '').replace(/\s/g, '');
	}).filter(line => line.length > 0)//remove empty lines
	.map((line, index) => {//map label values to array of numbers
		let probabilities = line.split(',').map(parseFloat);
		if(probabilities.length !== CATEGORIES.COUNT)
			console.error(`Incorrect number of label values. There are ${CATEGORIES.COUNT} categories but only ${
				probabilities.length} values in ${index+1}nth labels element`);
		return probabilities;
	}).reduce((prev, curr) =>  prev.concat(curr));//flatten array of label values
}

async function loadImagesData(images: string[]) {
	let data = new Float32Array(images.length * IMAGE_SIZE);//RGB array
	let data_i = 0;
	
	for(let img_path of images) {
		let img = sharp( img_path );
		let channels = (await img.metadata()).channels || 0;
		
		let buffer = await img.resize(IMAGE_INFO.width, IMAGE_INFO.height).raw().toBuffer();
		if(buffer.length !== channels*IMAGE_INFO.width*IMAGE_INFO.height)
			console.error(`Incorrect image size (${img_path})`);
		
		for(let i=0; i<buffer.length; i+=channels) {
			for(let c=0; c<IMAGE_INFO.channels; c++)
				data[data_i++] = buffer[i+c]/255.0;
		}
	}
	if(data_i !== data.length)
		console.error('Image data has not been loaded correctly');
	
	return data;
}

export async function watch() {
	let labels_data_raw = Uint8Array.from( readLabelValues() );
	//console.log( labels_data );
	
	const elements = (labels_data_raw.length / CATEGORIES.COUNT) | 0;
	console.log('elements:', elements);
	
	const train_elements = (elements * 0.9)|0;
	console.log('train elements:', train_elements);
	
	let images = fs.readdirSync(dataset_dir).filter(file => file.match(/\d+\.(jpe?g|png|webp)/));
	images = images.sort((a,b) => {
		let a_index = parseInt( (a.match(/\d+/) || [])[0] );
		let b_index = parseInt( (b.match(/\d+/) || [])[0] );
		
		return a_index - b_index;
	}).map((img, index) => {
		let img_number = parseInt( (img.match(/\d+/) || [])[0] );
		if(img_number !== index+1)
			console.error(`Images order is not consistent or image with number: ${img_number} does not exist`);
		return path.join(dataset_dir, img);
	});
	
	if(images.length !== elements)
		console.error('There are different number of dataset images than labels');
	
	let images_data_raw = await loadImagesData(images);
	
	let indices = CNN.createShuffledIndices(elements);
	
	//shuffle data
	const images_data = new Float32Array(images_data_raw.length);
	const labels_data = new Uint8Array(labels_data_raw.length);
	for(let i=0; i<indices.length; i++) {
		let idx = indices[i];
		images_data.set(images_data_raw.slice(IMAGE_SIZE*idx, IMAGE_SIZE*(idx+1)), IMAGE_SIZE*i);
		labels_data.set(labels_data_raw.slice(CATEGORIES.COUNT*idx, CATEGORIES.COUNT*(idx+1)), CATEGORIES.COUNT*i);
	}
	
	const train_data = CNN.getDataTensors(
		images_data.slice(0, IMAGE_SIZE*train_elements),
		labels_data.slice(0, CATEGORIES.COUNT*train_elements),
		train_elements, IMAGE_INFO, CATEGORIES.COUNT
	);
	
	const test_data = CNN.getDataTensors(
		images_data.slice(IMAGE_SIZE*train_elements),
		labels_data.slice(CATEGORIES.COUNT*train_elements),
		elements-train_elements, IMAGE_INFO, CATEGORIES.COUNT
	);
	
	//const model = CNN.getModel(IMAGE_INFO, CATEGORIES.COUNT);
	const model = await CNN.loadModel( path.join(models_dir, 'test_model', 'model.json') );
	await CNN.train(model, train_data, test_data, 100);
	console.log('training complete');
	
	train_data.pixels.dispose();
	train_data.labels.dispose();
	
	//validate
	/*let validate_img = await loadImagesData([
		path.join(dataset_dir, 'test_square.jpg'),
		path.join(dataset_dir, 'test_circle.jpg')
	]);
	const validate_data = CNN.getImageTensor(validate_img, 2, IMAGE_INFO);*/
	let prediction = CNN.predict(model, test_data.pixels);
	
	let expected_labels = test_data.labels.dataSync();
	let expected_predictions: CATEGORIES[] = [];
	for(let i=0; i<expected_labels.length; i++) {
		if(expected_labels[i] === 1)
			expected_predictions.push( i%3 );
	}
	
	console.log( prediction );
	console.log( Int32Array.from(expected_predictions) );
	
	test_data.pixels.dispose();
	test_data.labels.dispose();
	//validate_data.dispose();
	await model.save( 'file://' + path.join(models_dir, 'test_model') );
	model.dispose();
}