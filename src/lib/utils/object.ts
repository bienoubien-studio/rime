import type { Dic, WithRequired } from 'rizom/types/utility';

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
	obj: T,
	props: U
): obj is WithRequired<T, U[number]> {
	return props.every((prop) => obj[prop] !== undefined);
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
