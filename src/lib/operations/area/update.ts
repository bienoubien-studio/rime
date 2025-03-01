import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter, CompiledArea, GenericDoc, AreaHooks, LocalAPI } from 'rizom/types';
import { operationRunner } from '../pipe/index.server.js';
import { authorize } from '../pipe/tasks/shared/authorize.server.js';
import { fetchOriginal } from '../pipe/tasks/area/fetch-original.server.js';
import { provideFieldResolver } from '../pipe/tasks/shared/field-resolver/index.server.js';
import { validate } from '../pipe/tasks/shared/fields/validate.server.js';
import { updateRoot } from '../pipe/tasks/area/updateRoot.server.js';
import { saveBlocks } from '../pipe/tasks/shared/blocks/index.server.js';
import { saveTreeBlocks } from '../pipe/tasks/shared/tree/index.server.js';
import { saveRelations } from '../pipe/tasks/shared/relations/index.server.js';
import { fetchAreaRaw } from '../pipe/tasks/area/fetch-raw.server.js';
import { transformDocument } from '../pipe/tasks/shared/transform.server.js';
import { processHooks } from '../pipe/tasks/shared/hooks.server.js';

type UpdateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
};

export const update = async <T extends GenericDoc = GenericDoc>(args: UpdateArgs<T>) => {
	//
	const operation = operationRunner({
		...args,
		internal: {},
		operation: 'update'
	});

	const result = await operation
		.use(
			authorize,
			fetchOriginal,
			provideFieldResolver('original'),
			provideFieldResolver('incoming'),
			validate,
			processHooks<AreaHooks>('beforeUpdate'),
			updateRoot,
			saveBlocks,
			saveTreeBlocks,
			saveRelations,
			fetchAreaRaw,
			transformDocument,
			processHooks<AreaHooks>('afterUpdate')
		)
		.run();

	return result.document as T;
};
