import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
import type { OperationQuery } from 'rizom/types/api.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { RegisterCollection } from 'rizom';
import { authorize } from '../pipe/middleware/shared/authorize.server';
import { createPipe } from '../pipe/index.server';
import { queryCollectionDocumentsRaw } from '../pipe/middleware/collection/query-documents-raw.server.js';
import { transformAllDocuments } from '../pipe/middleware/shared/transform-all.server';
import { hooksBeforeRead } from '../pipe/middleware/collection/hooks-before-read.server';

type FindArgs = {
	query: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
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
	const findOperation = createPipe({
		...args,
		operation: 'read',
		internal: {}
	});

	const result = await findOperation
		.use(
			authorize,
			queryCollectionDocumentsRaw,
			transformAllDocuments,
			hooksBeforeRead({ multiple: true })
		)
		.run();

	return result.documents as T[];
};
