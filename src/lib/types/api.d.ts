export type { LocalAPI } from '$lib/operations/localAPI/index.server';

export type OperationQuery =
	| string
	| {
			[key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
	  };
