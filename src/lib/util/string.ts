import camelCase from 'camelcase';
import snakeCase from 'to-snake-case';

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
export const toCamelCase = (str: string): string => camelCase(str);
export const toPascalCase = (str: string): string => camelCase(str, { pascalCase: true });

export const toSnakeCase = (str: string) => {
	const hasLeadingUnderscore = str.startsWith('_');
	if (hasLeadingUnderscore) {
		str = str.slice(1);
	}
	const out = snakeCase(str);
	return hasLeadingUnderscore ? `_${out}` : out;
};

export const slugify = (text: string): string => {
	return text
		.toString() // Cast to string (optional)
		.normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
		.toLowerCase() // Convert the string to lowercase letters
		.trim() // Remove whitespace from both sides of a string (optional)
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/[^\w-]+/g, '') // Remove all non-word chars
		.replace(/--+/g, '-');
};

export function toHash(str: string) {
	const seed = 0;
	let h1 = seed;

	for (let i = 0; i < str.length; i++) {
		h1 ^= str.charCodeAt(i);
		h1 = Math.imul(h1, 0xcc9e2d51);
		h1 = Math.imul((h1 >>> 13) | (h1 << 19), 0x1b873593);
	}

	return Math.abs(h1).toString();
}

export const isCamelCase = (str: string) => /^[a-z][a-zA-Z0-9]*$/.test(str);
