import type { RequestEvent } from '@sveltejs/kit';
import type {
	LocalAPI,
	CollectionHooks,
	Adapter,
	CollectionSlug,
	GenericDoc,
	CompiledCollection
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { operationRunner } from '../pipe/index.server.js';
import { authorize } from '../pipe/tasks/shared/authorize.server.js';
import { provideFieldResolver } from '../pipe/tasks/shared/field-resolver/index.server.js';
import { setDefaultValues } from '../pipe/tasks/shared/fields/set-default-values.js';
import { validate } from '../pipe/tasks/shared/fields/validate.server.js';
import { processHooks } from '../pipe/tasks/shared/hooks.server.js';
import { insertRoot } from '../pipe/tasks/collection/insert-root.server.js';
import { saveBlocks } from '../pipe/tasks/shared/blocks/index.server.js';
import { saveTreeBlocks } from '../pipe/tasks/shared/tree/index.server.js';
import { saveRelations } from '../pipe/tasks/shared/relations/index.server.js';
import { fetchRaw } from '../pipe/tasks/collection/fetch-raw.server.js';
import { fallbackLocale } from '../pipe/tasks/collection/fallback-locale.server.js';
import cloneDeep from 'clone-deep';
import { transformDocument } from '../pipe/tasks/shared/transform.server.js';
import { addAuthFields } from '../pipe/tasks/collection/add-auth-fields.js';
import { mergeDataWithBlankDocument } from '../pipe/tasks/collection/merge-with-blank.js';
import { provideConfigMap } from '../pipe/tasks/shared/config-map/index.server.js';

type Args<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	api: LocalAPI;
	event: RequestEvent & {
		locals: App.Locals;
	};
	adapter: Adapter;
};

export const create = async <T extends RegisterCollection[CollectionSlug]>(args: Args<T>) => {
	const incomingData = cloneDeep(args.data);
	//
	const operation = operationRunner({
		...args,
		operation: 'create',
		internal: {}
	});

	const result = await operation
		.use(
			authorize,
			addAuthFields,
			mergeDataWithBlankDocument,
			provideConfigMap('data'),
			provideFieldResolver('incoming'),
			setDefaultValues,
			validate,
			processHooks<CollectionHooks>('beforeCreate'),
			insertRoot,
			saveBlocks,
			saveTreeBlocks,
			saveRelations,
			fetchRaw,
			fallbackLocale(incomingData),
			transformDocument,
			processHooks<CollectionHooks>('afterCreate')
		)
		.run();

	const doc = result.document as T;
	return { doc };
};
