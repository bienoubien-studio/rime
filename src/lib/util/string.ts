import camelCase from 'camelcase';

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
export const toCamelCase = (str: string): string => camelCase(str);
export const toPascalCase = (str: string): string => camelCase(str, { pascalCase: true });

/**
 * Converts a string to snake_case
 * This is a custom implementation that replaces the to-snake-case dependency
 * and maintains the same functionality of the original package
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
