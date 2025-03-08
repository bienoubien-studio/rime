export type { LocalAPI } from 'rizom/operations/localAPI/index.server';

export type OperationQuery =
	| string
	| {
			[key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
	  };
