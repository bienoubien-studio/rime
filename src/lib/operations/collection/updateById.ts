import { type RequestEvent } from '@sveltejs/kit';
import type {
	Adapter,
	LocalAPI,
	CollectionSlug,
	GenericDoc,
	CompiledCollection,
	CollectionHooks
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { operationRunner } from '../pipe/index.server.js';
import { authorize } from '../pipe/tasks/shared/authorize.server.js';
import { fetchOriginal } from '../pipe/tasks/collection/fetch-original.server.js';
import { addAuthFields } from '../pipe/tasks/collection/add-auth-fields.js';
import { provideFieldResolver } from '../pipe/tasks/shared/field-resolver/index.server.js';
import { setDefaultValues } from '../pipe/tasks/shared/fields/set-default-values.js';
import { validate } from '../pipe/tasks/shared/fields/validate.server.js';
import { processHooks } from '../pipe/tasks/shared/hooks.server.js';
import { updateRoot } from '../pipe/tasks/collection/update-root.server.js';
import { saveBlocks } from '../pipe/tasks/shared/blocks/index.server.js';
import { saveTreeBlocks } from '../pipe/tasks/shared/tree/index.server.js';
import { saveRelations } from '../pipe/tasks/shared/relations/index.server.js';
import { fetchRaw } from '../pipe/tasks/collection/fetch-raw.server.js';
import { transformDocument } from '../pipe/tasks/shared/transform.server.js';

type Args<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
};

export const updateById = async <T extends RegisterCollection[CollectionSlug]>(args: Args<T>) => {
	const operation = operationRunner({
		...args,
		internal: {},
		operation: 'update'
	});

	const result = await operation
		.use(
			authorize,
			fetchOriginal,
			addAuthFields,
			provideFieldResolver('original'),
			provideFieldResolver('incoming'),
			setDefaultValues(),
			validate,
			processHooks<CollectionHooks>('beforeUpdate'),
			updateRoot,
			saveBlocks,
			saveTreeBlocks,
			saveRelations,
			fetchRaw,
			transformDocument,
			processHooks<CollectionHooks>('afterUpdate')
		)
		.run();

	return result.document as T;
};
