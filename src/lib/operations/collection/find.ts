import type { RequestEvent } from '@sveltejs/kit';
import type {
	CollectionHooks,
	Adapter,
	CollectionSlug,
	CompiledCollection,
	LocalAPI,
	OperationQuery
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { authorize } from '../pipe/tasks/shared/authorize.server';
import { operationRunner, stack } from '../pipe/index.server';
import { fetchRaws } from '../pipe/tasks/collection/fetch-raws.server';
import { processHooks } from '../pipe/tasks/shared/hooks.server';
import { transformDocument } from '../pipe/tasks/shared/transform.server';

type FindArgs = {
	query: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const find = async <T extends RegisterCollection[CollectionSlug]>(
	args: FindArgs
): Promise<T[]> => {
	//
	const operation = operationRunner({
		...args,
		operation: 'read',
		internal: {}
	});

	const result = await operation
		.use(
			authorize,
			fetchRaws,
			stack(transformDocument),
			stack(processHooks<CollectionHooks>('beforeRead'))
		)
		.run();

	return result.documents as T[];
};
