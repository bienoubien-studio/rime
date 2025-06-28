import type { Dic, WithRequired } from '$lib/util/types';

/**
 * Creates a new object with only the specified keys from the original object.
 *
 * @param keys - Array of keys to include in the new object
 * @param obj - Source object to pick properties from
 * @returns A new object containing only the specified keys
 *
 * @example
 * // Returns { name: 'John', age: 30 }
 * pick(['name', 'age'], { name: 'John', age: 30, email: 'john@example.com' });
 */
export const pick = <T extends object, K extends keyof T>(keys: K[], obj: T): Pick<T, K> => {
	const res: Partial<T> = {};
	for (const key of keys) {
		if (key in obj) {
			res[key] = obj[key];
		}
	}
	return res as Pick<T, K>;
};

/**
 * Creates a new object without the specified keys from the original object.
 *
 * @param keys - Array of keys to exclude from the new object
 * @param obj - Source object to omit properties from
 * @returns A new object containing all properties except the specified keys
 *
 * @example
 * // Returns { email: 'john@example.com' }
 * omit(['name', 'age'], { name: 'John', age: 30, email: 'john@example.com' });
 */
export const omit = <T extends object, K extends keyof T>(keys: K[], obj: T): Omit<T, K> => {
	const res: Partial<T> = { ...obj };
	for (const key of keys) {
		delete res[key];
	}
	return res as Omit<T, K>;
};

/**
 * Creates a new object with all non-null properties from the original object.
 *
 * @param obj - Source object to filter null values from
 * @returns A new object with all non-null properties
 *
 * @example
 * // Returns { name: 'John', email: 'john@example.com' }
 * withoutNull({ name: 'John', age: null, email: 'john@example.com' });
 */
export const withoutNull = <T extends object, K extends keyof T>(obj: T): Partial<T> => {
	const res: Partial<T> = {};
	for (const key of Object.keys(obj) as K[]) {
		if (obj[key] !== null) {
			res[key] = obj[key];
		}
	}
	return res;
};

/**
 * Creates a new object without the 'id' property from the original object.
 * Specialized version of omit for the common case of removing IDs.
 *
 * @param obj - Source object to remove the id from
 * @returns A new object without the id property
 *
 * @example
 * // Returns { name: 'John', age: 30 }
 * omitId({ id: '123', name: 'John', age: 30 });
 */
export const omitId = <T extends { id?: string; [k: string]: any }>(obj: T): Omit<T, 'id'> =>
	omit(['id'], obj) as Omit<T, 'id'>;

/**
 * Type guard to check if an object has all the specified properties.
 *
 * @param props - Array of property keys to check for
 * @param obj - Object to check properties on
 * @returns True if the object has all the specified properties, false otherwise
 *
 * @example
 * // Returns true if user has both name and email properties
 * if (hasProps(['name', 'email'], user)) {
 *   // TypeScript knows user.name and user.email are defined
 *   console.log(`${user.name}: ${user.email}`);
 * }
 */
export function hasProps<T extends object, U extends Array<keyof T>>(
	props: U,
	obj: T
): obj is WithRequired<T, U[number]> {
	return props.every((prop) => obj[prop] !== undefined);
}

/**
 * Type guard to check if an object has a specific property.
 *
 * @param prop - Property key to check for
 * @param obj - Object to check the property on
 * @returns True if the object has the specified property, false otherwise
 *
 * @example
 * // Returns true if user has an email property
 * if (hasProp('email', user)) {
 *   // TypeScript knows user.email is defined
 *   sendEmail(user.email);
 * }
 */
export function hasProp<T extends object, U extends keyof T>(prop: U, obj: T): obj is T & Required<Pick<T, U>> {
	return obj[prop] !== undefined;
}

/**
 * Checks if a value is a Buffer object.
 *
 * @param obj - Value to check
 * @returns True if the value is a Buffer, false otherwise
 *
 * @example
 * // Returns true for Buffer objects
 * isBuffer(Buffer.from('test'));
 */
export function isBuffer(obj: any) {
	return obj && obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

/**
 * Checks if a value is a plain object literal (not an array, null, or a class instance).
 *
 * @param object - Value to check
 * @returns True if the value is a plain object literal, false otherwise
 *
 * @example
 * // Returns true
 * isObjectLiteral({ a: 1, b: 2 });
 *
 * // Returns false
 * isObjectLiteral([1, 2, 3]);
 * isObjectLiteral(null);
 * isObjectLiteral(new Date());
 */
export function isObjectLiteral(object: any): object is Dic {
	return (
		typeof object === 'object' &&
		object !== null &&
		!Array.isArray(object) &&
		Object.getPrototypeOf(object) === Object.prototype
	);
}

/**
 * Options for the flattenWithGuard function
 */
type FlattenWithGuardOptions = {
	/** Maximum depth to flatten (undefined for unlimited) */
	maxDepth?: number;
	/** Whether to preserve arrays (true) or flatten them (false) */
	safe?: boolean;
	/** Function to determine if a key-value pair should be flattened */
	shouldFlat?: ([key, value]: [string, any]) => boolean;
};
type FlattenWithGuard = (data: Dic, opts?: FlattenWithGuardOptions) => Dic;

/**
 * Flattens a nested object structure into a single-level object with dot notation keys.
 * Provides options to control the flattening behavior.
 *
 * @param data - The nested object to flatten
 * @param opts - Options to control flattening behavior
 * @returns A flattened object with dot notation keys
 *
 * @example
 * // Basic usage - returns { "user.name": "John", "user.address.city": "New York" }
 * flattenWithGuard({ user: { name: "John", address: { city: "New York" } } });
 *
 * // With maxDepth=1 - returns { "user.name": "John", "user.address": { city: "New York" } }
 * flattenWithGuard({ user: { name: "John", address: { city: "New York" } } }, { maxDepth: 1 });
 *
 * // With shouldFlat - only flatten properties that aren't "address"
 * // Returns { "user.name": "John", "user.address": { city: "New York" } }
 * flattenWithGuard(
 *   { user: { name: "John", address: { city: "New York" } } },
 *   { shouldFlat: ([key]) => key !== "address" }
 * );
 */
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

/**
 * Gets a value from a nested object using a dot notation path.
 *
 * @param path - Dot notation path to the desired value (e.g., 'user.address.city')
 * @param obj - Object to retrieve the value from
 * @returns The value at the specified path, or undefined if not found
 *
 * @example
 * // Returns "New York"
 * getValueAtPath('user.address.city', { user: { address: { city: "New York" } } });
 *
 * // Returns undefined
 * getValueAtPath('user.phone', { user: { address: { city: "New York" } } });
 */
export const getValueAtPath = <T>(path: string, obj: Dic): T | undefined => {
	const parts = path.split('.');
	let current = obj;
	for (const part of parts) {
		if (/^d+$/.test(part)) {
			current = current[parseInt(part)];
		} else {
			current = current[part];
		}
		if (current === undefined) {
			return undefined;
		}
	}
	return current as T;
};

/**
 * Sets a value in a nested object using a dot notation path.
 * Creates the path if it doesn't exist and returns a new object without modifying the original.
 *
 * @param obj - Source object to set the value in
 * @param path - Dot notation path where the value should be set
 * @param value - Value to set at the specified path
 * @returns A new object with the value set at the specified path
 *
 * @example
 * // Returns { user: { address: { city: "Boston" } } }
 * setValueAtPath('user.address.city', { user: { address: { city: "New York" } } }, 'Boston');
 *
 * // Creates missing path and returns { user: { phone: "555-1234" } }
 * setValueAtPath('user.phone', { user: {} }, '555-1234');
 */
export const setValueAtPath = <T extends Dic>(path: string, obj: T, value: unknown): T => {
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

		// Create the object path if it doesn't exist
		if (!current[index]) {
			// If the next part is a number, create an array, otherwise create an object
			const nextPart = parts[i + 1];
			const isNextPartNumeric = /^\d+$/.test(nextPart);
			current[index] = isNextPartNumeric ? [] : {};
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
		// Use a type assertion only for the assignment
		(result as any)[lastIndex] = value;
	}

	return result;
};

/**
 * Deletes a value at a specified path in an object.
 *
 * @param obj - Source object to delete the value from
 * @param path - Dot notation path to the value that should be deleted
 * @returns The modified object with the value removed
 *
 * @example
 * // Returns { user: { name: "John" } }
 * deleteValueAtPath({ user: { name: "John", age: 30 } }, 'user.age');
 */
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
