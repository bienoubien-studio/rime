import camelCase from 'camelcase';

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize
 * @returns The string with its first letter capitalized
 *
 * @example
 * // Returns "Hello"
 * capitalize("hello");
 */
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Converts a string to camelCase.
 * Uses the camelcase package for consistent conversion.
 *
 * @param str - The string to convert
 * @returns The camelCase version of the string
 *
 * @example
 * // Returns "helloWorld"
 * toCamelCase("hello-world");
 */
export const toCamelCase = (str: string): string => camelCase(str);

/**
 * Converts a string to PascalCase.
 * Uses the camelcase package with pascalCase option.
 *
 * @param str - The string to convert
 * @returns The PascalCase version of the string
 *
 * @example
 * // Returns "HelloWorld"
 * toPascalCase("hello-world");
 */
export const toPascalCase = (str: string): string => camelCase(str, { pascalCase: true });

/**
 * Converts a string to snake_case.
 * This is a custom implementation that replaces the to-snake-case dependency
 * and maintains the same functionality of the original package.
 *
 * @param str - The string to convert
 * @returns The snake_case version of the string
 *
 * @example
 * // Returns "hello_world"
 * toSnakeCase("helloWorld");
 *
 * // Returns "_hello_world"
 * toSnakeCase("_helloWorld");
 */
export const toSnakeCase = (str: string): string => {
	// Preserve leading underscore if present
	const hasLeadingUnderscore = str.startsWith('_');
	if (hasLeadingUnderscore) {
		str = str.slice(1);
	}

	// First convert to space case (similar to to-space-case)
	// Handle special characters and replace with spaces
	let result = str
		// Handle camel case
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		// Handle special characters
		.replace(/[^A-Za-z0-9]+/g, ' ')
		// Remove leading and trailing spaces
		.trim()
		.toLowerCase();

	// Convert spaces to underscores (snake_case)
	result = result.replace(/ /g, '_');

	// Restore leading underscore if it was present
	return hasLeadingUnderscore ? `_${result}` : result;
};

/**
 * Converts a string to a URL-friendly slug.
 * Handles special characters, spaces, and Unicode normalization.
 *
 * @param text - The string to convert to a slug
 * @returns A URL-friendly slug version of the string
 *
 * @example
 * // Returns "hello-world"
 * slugify("Hello World!");
 *
 * // Returns "accentue"
 * slugify("Accentué");
 */
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

/**
 * Generates a numeric hash from a string using a simple hashing algorithm.
 * Useful for generating deterministic IDs from string content.
 *
 * @param str - The string to hash
 * @returns A string representation of the numeric hash
 *
 * @example
 * // Returns a consistent numeric hash string
 * toHash("hello");
 */
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

/**
 * Checks if a string is in camelCase format.
 * Validates that the string starts with a lowercase letter and contains only letters and numbers.
 *
 * @param str - The string to check
 * @returns True if the string is in camelCase format, false otherwise
 *
 * @example
 * // Returns true
 * isCamelCase("helloWorld");
 *
 * // Returns false
 * isCamelCase("HelloWorld");
 *
 * // Returns false
 * isCamelCase("hello_world");
 */
export const isCamelCase = (str: string) => /^[a-z][a-zA-Z0-9]*$/.test(str);
