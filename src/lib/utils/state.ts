import type { Dic } from 'rizom/types/utility';

export const snapshot = (state: any) => {
	function unProxy(object: any) {
		if (object && object.constructor === Proxy) {
			return object.target;
		}
		return object;
	}

	function parseArray(array: any[]) {
		const ouput: any[] = [];
		for (const [index, item] of array.entries()) {
			ouput[index] = step(item);
		}
		return ouput;
	}

	function parseObject(object: any) {
		const output: Dic = {};
		for (const [key, value] of Object.entries(object)) {
			output[key] = step(value);
		}
		return output;
	}

	function step(object: any) {
		const isArray = Array.isArray(object);
		const type = Object.prototype.toString.call(object);
		const isObject = type === '[object Object]';
		let output = unProxy(object);

		if (isArray) {
			output = parseArray(object);
		}

		if (isObject) {
			output = parseObject(object);
		}

		return output;
	}

	return step(state);
};
