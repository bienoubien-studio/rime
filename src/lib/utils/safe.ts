export const safe = async <T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> => {
	try {
		const result = await promise;
		return [null, result];
	} catch (error) {
		return [error as Error, null];
	}
};
