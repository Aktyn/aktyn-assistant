/** CONVOLUTIONAL NEURAL NETWORK MODULE **/

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
export {LayersModel} from '@tensorflow/tfjs';

export interface DataSchema {
	pixels: tf.Tensor<tf.Rank>;
	labels: tf.Tensor<tf.Rank.R2>;
}

interface ImageInfo {
	width: number;
	height: number;
	channels: number;
}

// noinspection JSUnusedGlobalSymbols
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

// noinspection JSUnusedGlobalSymbols
export function buildModel(image_info: ImageInfo, output_size: number): tf.LayersModel {
	const model = tf.sequential();
	
	//conv2d(K: 5, S: 1) => pool(F: 2, S: 2) => conv2d(K: 5, S: 1) => pool(F: 2, S: 2)
	//28 => 24 => 12 => 8 => 4
	//256 => 252 => 125 => 121 => 59 => 55 => 26 => 22 => 10
	
    //add first layer
	model.add(
		tf.layers.conv2d({
			inputShape: [image_info.width, image_info.height, image_info.channels],
			kernelSize: 5,
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
			kernelSize: 8,//5
			filters: 16,
			strides: 1,
			activation: 'relu',
			kernelInitializer: 'varianceScaling'
		})
	);
	model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
	
	//NEW: third  and fourth layer for 256x256 input
	model.add(
		tf.layers.conv2d({
			kernelSize: 5,
			filters: 32,
			strides: 1,
			activation: 'relu',
			kernelInitializer: 'varianceScaling'
		})
	);
	model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
	
	model.add(
		tf.layers.conv2d({
			kernelSize: 5,
			filters: 32,
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
                               image_info: ImageInfo, classes: number): DataSchema
{
    return {
    	pixels: getImageTensor(images_data, elements, image_info),
	    labels: tf.tensor2d(labels_data, [elements, classes])
    };
}

export function train(model: tf.LayersModel, train_data: DataSchema, test_data: DataSchema, epochs: number,
                      batchSize = 128) {
	/*const metrics = ['loss', 'acc'];//['loss', 'val_loss', 'acc', 'val_acc'];
	const container = {
		name: 'Model Training', styles: {height: '1000px'}
	};
	const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);*/
	
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
		batchSize: batchSize,
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
	return <Float32Array>(<tf.Tensor>model.predict(input_data))/*.argMax(-1)*/.dataSync();
}