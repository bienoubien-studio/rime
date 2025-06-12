/**
 * Safely executes a promise and returns a tuple containing either an error or the result.
 * This utility helps with error handling without try/catch blocks throughout the codebase.
 *
 * @param promise - The promise to be executed safely
 * @returns A tuple where the first element is either an Error or null, and the second element is either the result or null
 *
 * @example
 * // Using safe to handle API calls without try/catch
 * const [error, data] = await safe(fetchData());
 * if (error) {
 *   // Handle error case
 *   console.error(error);
 * } else {
 *   // Process data
 *   processData(data);
 * }
 */
export const safe = async <T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> => {
	try {
		const result = await promise;
		return [null, result];
	} catch (error) {
		return [error as Error, null];
	}
};
