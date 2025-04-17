import type { Dic, WithRequired } from '$lib/types/util';

export const pick = <T extends object, K extends keyof T>(keys: K[], obj: T): Pick<T, K> => {
	const res: Partial<T> = {};
	for (const key of keys) {
		if (key in obj) {
			res[key] = obj[key];
		}
	}
	return res as Pick<T, K>;
};

export const omit = <T extends object, K extends keyof T>(keys: K[], obj: T): Omit<T, K> => {
	const res: Partial<T> = { ...obj };
	for (const key of keys) {
		delete res[key];
	}
	return res as Omit<T, K>;
};

export const withoutNull = <T extends object, K extends keyof T>(obj: T): Partial<T> => {
	const res: Partial<T> = {};
	for (const key of Object.keys(obj) as K[]) {
		if (obj[key] !== null) {
			res[key] = obj[key];
		}
	}
	return res;
};

export const omitId = <T extends { id?: string; [k: string]: any }>(obj: T): Omit<T, 'id'> =>
	omit(['id'], obj) as Omit<T, 'id'>;

export function hasProps<T extends object, U extends Array<keyof T>>(
	props: U,
	obj: T
): obj is WithRequired<T, U[number]> {
	return props.every((prop) => obj[prop] !== undefined);
}

export function hasProp<T extends object, U extends keyof T>(
	prop: U,
	obj: T
): obj is T & Required<Pick<T, U>> {
	return obj[prop] !== undefined;
}

export function isBuffer(obj: any) {
	return (
		obj &&
		obj.constructor &&
		typeof obj.constructor.isBuffer === 'function' &&
		obj.constructor.isBuffer(obj)
	);
}

export function isObjectLiteral(object: any): object is Dic {
	return (
		typeof object === 'object' &&
		object !== null &&
		!Array.isArray(object) &&
		Object.getPrototypeOf(object) === Object.prototype
	);
}

type FlattenWithGuardOptions = {
	maxDepth?: number;
	safe?: boolean;
	shouldFlat?: ([key, value]: [string, any]) => boolean;
};
type FlattenWithGuard = (data: Dic, opts?: FlattenWithGuardOptions) => Dic;

export const flattenWithGuard: FlattenWithGuard = (data, opts) => {
	opts = opts || {};

	const delimiter = '.';
	const shouldFlat = opts.shouldFlat || (() => true);
	const maxDepth = opts.maxDepth;
	const output: Dic = {};
	const safe = opts.safe || false;

	function step(object: Dic, prev?: string, currentDepth?: number) {
		currentDepth = currentDepth || 1;
		Object.keys(object).forEach(function (key) {
			const value = object[key];
			const isarray = safe && Array.isArray(value);
			const type = Object.prototype.toString.call(value);
			const isbuffer = isBuffer(value);
			const isobject = type === '[object Object]' || type === '[object Array]';

			const newKey = prev ? prev + delimiter + key : key;

			if (
				shouldFlat([key, value]) &&
				!isarray &&
				!isbuffer &&
				isobject &&
				Object.keys(value).length &&
				(!maxDepth || currentDepth < maxDepth)
			) {
				return step(value, newKey, currentDepth + 1);
			}

			output[newKey] = value;
		});
	}

	step(data);

	return output;
};

export const getValueAtPath = <T extends unknown>(path: string, obj: Dic): T | null | undefined => {
	const parts = path.split('.');
	let current = obj;
	for (const part of parts) {
		if (/^d+$/.test(part)) {
			current = current[parseInt(part)];
		} else {
			current = current[part];
		}
		if (!current) {
			return current;
		}
	}
	return current as T;
};

export const setValueAtPath = <T extends Dic>(obj: T, path: string, value: unknown): T => {
	const parts = path.split('.');

	// Create a shallow copy of the root object
	const result = { ...obj };

	let current: any = result;
	let previous = null;
	let previousKey: string | number = '';

	// Navigate to the parent of the target property
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		const index = /^\d+$/.test(part) ? parseInt(part) : part;

		previous = current;
		previousKey = index;

		if (!current[index]) {
			throw new Error(`Path ${path} does not exist at part ${part}`);
		}

		// Create a shallow copy of the current level before moving deeper
		if (Array.isArray(current[index])) {
			current[index] = [...current[index]];
		} else if (typeof current[index] === 'object' && current[index] !== null) {
			current[index] = { ...current[index] };
		}

		current = current[index];
	}

	// Set the value at the final path segment
	const lastPart = parts[parts.length - 1];
	const lastIndex = /^\d+$/.test(lastPart) ? parseInt(lastPart) : lastPart;

	if (previous !== null) {
		if (Array.isArray(previous[previousKey])) {
			previous[previousKey][lastIndex] = value;
		} else if (typeof previous[previousKey] === 'object' && previous[previousKey] !== null) {
			previous[previousKey][lastIndex] = value;
		}
	} else {
		// We're setting a property directly on the root object
		//@ts-ignore just now I don't care that T is generic and can only be indexed
		// for reading... and actually TS I just set it like that :
		result[lastIndex] = value;
	}

	return result;
};

export function deleteValueAtPath<T>(obj: T, path: string): T {
	const parts = path.split('.');
	const last = parts.pop()!;

	let current: any = obj;
	for (const part of parts) {
		const key = !isNaN(Number(part)) ? Number(part) : part;
		if (!(key in current)) return obj;
		current = current[key];
	}

	const finalKey = !isNaN(Number(last)) ? Number(last) : last;
	delete current[finalKey];
	return obj;
}
