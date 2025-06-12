/**
 * Generates a random alphanumeric string of specified length.
 * Useful for creating unique identifiers, temporary tokens, or random keys.
 *
 * @param length - The desired length of the random string
 * @returns A random string containing uppercase letters, lowercase letters, and numbers
 *
 * @example
 * // Generate a random ID with 10 characters
 * const id = randomId(10);
 * // Result example: "a7bF9cD3eZ"
 */
export const randomId = (length: number): string => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};
