import * as robot from 'robotjs';

export function getScreenshot(x?: number, y?: number, width?: number, height?: number) {
	return robot.screen.capture(x, y, width, height);
}

export function typeString(str: string) {
	robot.typeString(str);
}

type modifier = 'alt' | 'command' | 'control' | 'shift';

export function tapKey(key: string, modifiers?: [modifier] | modifier) {
	robot.keyTap(key, modifiers);
}

export function getPixelColor(x: number, y: number) {
	return robot.getPixelColor(x, y);
}