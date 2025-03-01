import type { RequestEvent } from '@sveltejs/kit';
import type {
	CollectionSlug,
	Adapter,
	CompiledCollection,
	LocalAPI,
	CollectionHooks
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { operationRunner } from '../pipe/index.server';
import { authorize } from '../pipe/tasks/shared/authorize.server';
import { omitId } from 'rizom/utils/object';
import { transformDocument } from '../pipe/tasks/shared/transform.server';
import { fetchRaw } from '../pipe/tasks/collection/fetch-raw.server';
import { processHooks } from '../pipe/tasks/shared/hooks.server';
import { provideFieldResolver } from '../pipe/tasks/shared/field-resolver/index.server';

type Args = {
	id: string;
	locale?: string | undefined;
	config: CompiledCollection;
	api: LocalAPI;
	event: RequestEvent;
	adapter: Adapter;
	depth?: number;
};

export const findById = async <T extends RegisterCollection[CollectionSlug]>(args: Args) => {
	//
	const operation = operationRunner({
		...omitId(args),
		data: { id: args.id },
		operation: 'read',
		internal: {}
	});

	const result = await operation
		.use(
			//
			authorize,
			fetchRaw,
			provideFieldResolver('original'),
			transformDocument,
			processHooks<CollectionHooks>('beforeRead')
		)
		.run();

	return result.document as T;
};
