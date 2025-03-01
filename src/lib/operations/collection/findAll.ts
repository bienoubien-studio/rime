import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { RegisterCollection } from 'rizom';
import { operationRunner, stack } from '../pipe/index.server';
import { authorize } from '../pipe/tasks/shared/authorize.server';
import { processHooks } from '../pipe/tasks/shared/hooks.server';
import type { CollectionHooks } from 'rizom/types';
import { fetchRaws } from '../pipe/tasks/collection/fetch-raws.server';
import { transformDocument } from '../pipe/tasks/shared/transform.server';

type Args = {
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const findAll = async <T extends RegisterCollection[CollectionSlug]>(
	args: Args
): Promise<T[]> => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////

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
