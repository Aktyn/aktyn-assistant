/** CONVOLUTIONAL NEURAL NETWORK MODULE **/

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node-gpu';

interface DataSchema {
	pixels: tf.Tensor<tf.Rank>;
	labels: tf.Tensor<tf.Rank.R2>;
}

interface ImageInfo {
	width: number;
	height: number;
	channels: number;
}

export async function loadModel(path: string) {
	let model = await tf.loadLayersModel('file://' + path);
	//compile model
	const optimizer = tf.train.adam();
	model.compile({
		optimizer: optimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});
	return model;
}

export function getModel(image_info: ImageInfo, output_size: number) {
	const model = tf.sequential();
	
    //add first layer
	model.add(
		tf.layers.conv2d({
			inputShape: [image_info.width, image_info.height, image_info.channels],
			kernelSize: 5,//TODO: try higher since there are high-res images processed
			filters: 8,
			strides: 1,
			activation: 'relu',
			kernelInitializer: 'varianceScaling'
		})
	);
	
	//add max pooling layer
	model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
	
	//next pair of convolutional + max pooling layers
	model.add(
		tf.layers.conv2d({
			kernelSize: 5,
			filters: 16,
			strides: 1,
			activation: 'relu',
			kernelInitializer: 'varianceScaling'
		})
	);
	model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
	
	//flatten 2d image data into 1d array
	model.add(tf.layers.flatten());
	
	//add dense layer
	//const NUM_OUTPUT_CLASSES = 10;//output_size
	model.add(tf.layers.dense({
		units: output_size,
		kernelInitializer: 'varianceScaling',
		activation: 'softmax'
	}));
	
	//compile model
	const optimizer = tf.train.adam();
	model.compile({
		optimizer: optimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});
	
	return model;
}

export function createShuffledIndices(elements: number) {
	return tf.util.createShuffledIndices(elements);
}

export function getImageTensor(images_data: Float32Array, elements: number, image_info: ImageInfo) {
	const image_size = image_info.width * image_info.height * image_info.channels;
	return tf.tensor2d(images_data, [elements, image_size])//TODO: shape properly in one step
		.reshape([elements, image_info.width, image_info.height, image_info.channels]);
}

export function getDataTensors(images_data: Float32Array, labels_data: Uint8Array, elements: number,
                               image_info: ImageInfo, classes: number)
{
    return {
    	pixels: getImageTensor(images_data, elements, image_info),
	    labels: tf.tensor2d(labels_data, [elements, classes])
    };
}

export function train(model: tf.LayersModel, train_data: DataSchema, test_data: DataSchema, epochs: number) {
	/*const metrics = ['loss', 'acc'];//['loss', 'val_loss', 'acc', 'val_acc'];
	const container = {
		name: 'Model Training', styles: {height: '1000px'}
	};
	const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);*/
	
	const BATCH_SIZE = 128;//512;
	//const TRAIN_DATA_SIZE = 5500;
	//const TEST_DATA_SIZE = 1000;
	
	const [trainXs, trainYs] = tf.tidy(() => {
		return [
			train_data.pixels,
			train_data.labels
		];
	});
	
	const [testXs, testYs] = tf.tidy(() => {
		return [
			test_data.pixels,
			test_data.labels
		];
	});
	
	return model.fit(trainXs, trainYs, {
		batchSize: BATCH_SIZE,
		validationData: [testXs, testYs],
		epochs: epochs,
		shuffle: true,
		//verbose: 0,
		/*callbacks: {
			onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log && log.loss}`)
		}*/
	});
}

export function predict(model: tf.LayersModel, input_data: tf.Tensor<tf.Rank>) {
	return (<tf.Tensor>model.predict(input_data)).argMax(-1).dataSync();
}