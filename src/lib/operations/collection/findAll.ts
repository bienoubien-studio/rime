import rizom from '$lib/rizom.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomError } from 'rizom/errors/index.js';
import type { RegisterCollection } from 'rizom';
import { createPipe } from '../pipe/index.server';
import { authorize } from '../pipe/middleware/shared/authorize.server';
import { queryCollectionDocumentsRaw } from '../pipe/middleware/collection/query-documents-raw.server';
import { transformAllDocuments } from '../pipe/middleware/shared/transform-all.server';
import { hooksBeforeRead } from '../pipe/middleware/collection/hooks-before-read.server';

type Args = {
	locale?: string | undefined;
	config: CompiledCollectionConfig;
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

	const findAllOperation = createPipe({
		...args,
		operation: 'read',
		internal: {}
	});

	const result = await findAllOperation
		.use(
			authorize,
			queryCollectionDocumentsRaw,
			transformAllDocuments,
			hooksBeforeRead({ multiple: true })
		)
		.run();

	return result.documents as T[];
};
