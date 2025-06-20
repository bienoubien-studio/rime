/**
 * Safely executes a promise and returns a tuple containing either an error or the result.
 * This utility helps with error handling without try/catch blocks throughout the codebase.
 *
 * @param promise - The promise to be executed safely
 * @returns A tuple where the first element is either an Error or null, and the second element is either the result or null
 *
 * @example
 * // Using safe to handle API calls without try/catch
 * const [error, data] = await trycatch(fetchData());
 * if (error) {
 *   // Handle error case
 *   console.error(error);
 * } else {
 *   // Process data
 *   processData(data);
 * }
 */
export const trycatch = async <T>(promise: Promise<T>): Promise<[Error, never] | [never, T]> => {
	try {
		const result = await promise;
		return [null, result] as [never, T];
	} catch (error) {
		return [error as Error, null] as [Error, never];
	}
};

/**
 * Safely executes a synchronous function and returns a tuple containing either an error or the result.
 * This utility helps with error handling without try/catch blocks throughout the codebase.
 *
 * @param fn - The synchronous function to be executed safely
 * @returns A tuple where the first element is either an Error or null, and the second element is either the result or null
 *
 * @example
 * // Using trycatchSync to handle synchronous operations without try/catch
 * const [error, data] = trycatchSync(() => JSON.parse(jsonString));
 * if (error) {
 *   // Handle error case
 *   console.error(error);
 * } else {
 *   // Process data
 *   processData(data);
 * }
 */
export const trycatchSync = <T>(fn: () => T): [Error, never] | [never, T] => {
	try {
		const result = fn();
		return [null, result] as [never, T];
	} catch (error) {
		return [error as Error, null] as [Error, never];
	}
};