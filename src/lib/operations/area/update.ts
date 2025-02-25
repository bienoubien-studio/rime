import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledAreaConfig } from 'rizom/types/config.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { createPipe } from '../pipe/index.server.js';
import { authorize } from '../pipe/middleware/shared/authorize.server.js';
import { fetchOriginal } from '../pipe/middleware/area/fetch-original.server.js';
import { provideFieldResolver } from '../pipe/middleware/shared/field-resolver/index.server.js';
import { validateFields } from '../pipe/middleware/shared/field-validation.server.js';
import { hooksAfterUpdate, hooksBeforeUpdate } from '../pipe/middleware/area/hooks.server.js';
import { updateRoot } from '../pipe/middleware/area/updateRoot.server.js';
import { saveBlocks } from '../pipe/middleware/shared/blocks/index.server.js';
import { saveTreeBlocks } from '../pipe/middleware/shared/tree/index.server.js';
import { saveRelations } from '../pipe/middleware/shared/relations/index.server.js';
import { fetchAreaRaw } from '../pipe/middleware/area/fetch-raw.server.js';
import { transformDocument } from '../pipe/middleware/shared/transform.server.js';

type UpdateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledAreaConfig;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
};

export const update = async <T extends GenericDoc = GenericDoc>({
	data,
	locale,
	config,
	api,
	event,
	adapter
}: UpdateArgs<T>) => {
	//
	const updateProcess = createPipe({
		data,
		locale,
		config,
		event,
		api,
		adapter,
		internal: {},
		operation: 'update'
	});

	const result = await updateProcess
		.use(
			authorize,
			fetchOriginal,
			provideFieldResolver('original'),
			provideFieldResolver('incoming'),
			validateFields,
			hooksBeforeUpdate,
			updateRoot,
			saveBlocks,
			saveTreeBlocks,
			saveRelations,
			fetchAreaRaw,
			transformDocument,
			hooksAfterUpdate
		)
		.run();

	return result.document as T;
};
