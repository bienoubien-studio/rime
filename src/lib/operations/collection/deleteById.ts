import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterCollection } from 'rizom';
import type {
	CollectionSlug,
	LocalAPI,
	Adapter,
	CompiledCollection,
	CollectionHooks
} from 'rizom/types';
import { omitId } from 'rizom/utils/object';
import { operationRunner } from '../pipe/index.server';
import { authorize } from '../pipe/tasks/shared/authorize.server';
import { deleteDocument } from '../pipe/tasks/collection/delete-document.server';
import { processHooks } from '../pipe/tasks/shared/hooks.server';
import { fetchRaw } from '../pipe/tasks/collection/fetch-raw.server';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
};

export const deleteById = async <T extends RegisterCollection[CollectionSlug]>(
	args: DeleteArgs
): Promise<string> => {
	//
	const operation = operationRunner({
		...omitId(args),
		data: { id: args.id },
		operation: 'delete',
		internal: {}
	});

	await operation
		.use(
			//
			authorize,
			fetchRaw,
			processHooks<CollectionHooks>('beforeDelete'),
			deleteDocument,
			processHooks<CollectionHooks>('afterDelete')
		)
		.run();

	return args.id;
};
