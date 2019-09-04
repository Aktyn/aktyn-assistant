import {LayersModel, loadModel, getImageTensor, predict} from './common';
import * as path from 'path';
import * as sharp from 'sharp';
import {getScreenshot} from "../robot";

/*export const enum CATEGORIES {
	DESKTOP,
	WEBSITE,
	APP,
	GAME,
	MOVIE,
	IMAGE,
	TEXT,
	COUNT//determines number of categories
}*/

const models_dir = path.join(__dirname, '..', '..', 'models');
let model: LayersModel | null = null;

const IMAGE_INFO = {
	width: 256,
	height: 256,
	channels: 3
};
const IMAGE_SIZE = IMAGE_INFO.width * IMAGE_INFO.height * IMAGE_INFO.channels;

function assert(condition: boolean, error_msg: string) {
	if( !condition ) throw new Error(error_msg);
}

export async function classifyDesktopContent() {
	// SAVE SCREENSHOT AND CONVERT TO RGB BUFFER
	let screenshot = getScreenshot();
	let screenshot_buffer = Buffer.alloc(screenshot.width*screenshot.height * 3);
	for(let i=0; i<screenshot.width*screenshot.height; i++) {
		screenshot_buffer[i*3]   = screenshot.image[i*4+2];
		screenshot_buffer[i*3+1] = screenshot.image[i*4+1];
		screenshot_buffer[i*3+2] = screenshot.image[i*4];
	}
	
	// RESIZE, SAVE AND CONVERT SCREENSHOT
	let channels: 4 | 3 = 3;
	const opts = {
		raw: { width: screenshot.width, height: screenshot.height, channels: channels}
	};
	let buffer = await sharp(screenshot_buffer, opts).resize(IMAGE_INFO.width, IMAGE_INFO.height).raw().toBuffer();

	sharp(screenshot_buffer, opts)
		.resize(IMAGE_INFO.width, IMAGE_INFO.height)
		.toFile(path.join(__dirname, '..', '..', 'screenshot.jpg'));
	
	// CONVERT TO Float32Array FOR NEURAL NETWORK
	let data = new Float32Array(IMAGE_SIZE);//RGB array
	
	assert(buffer.length === channels*IMAGE_INFO.width*IMAGE_INFO.height,
			'Incorrect buffer size');
	let data_i = 0;
	for(let i=0; i<buffer.length; i+=channels) {
		for(let c=0; c<IMAGE_INFO.channels; c++)
			data[data_i++] = buffer[i+c]/255.0;
	}
	
	assert(data_i === data.length,'Image data has not been loaded correctly');
	
	/////////////////////////////////////////////////////
	if(!model)
		model = await loadModel( path.join(models_dir, 'screenshot_classification', 'model.json') );
	
	let input_tensor = getImageTensor(data, 1, IMAGE_INFO);
	let prediction = Array.from( predict(model, input_tensor) );
	input_tensor.dispose();
	
	//if(prediction.length !== CATEGORIES.COUNT)
	//	throw new Error(`Incorrect prediction result. It should be array of ${CATEGORIES.COUNT} numbers`);
	
	return {
		DESKTOP:    prediction[0],
		WEBSITE:    prediction[1],
		APP:        prediction[2],
		GAME:       prediction[3],
		MOVIE:      prediction[4],
		IMAGE:      prediction[5],
		TEXT:       prediction[6]
	};
}