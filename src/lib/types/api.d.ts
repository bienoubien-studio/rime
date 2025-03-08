export type { LocalAPI } from 'rizom/operations/localAPI/index.server';

export type OperationQuery = {
	[key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
};
