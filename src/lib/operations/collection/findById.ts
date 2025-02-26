import type { RequestEvent } from '@sveltejs/kit';
import type { CollectionSlug, Adapter, CompiledCollectionConfig, LocalAPI } from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { createPipe } from '../pipe/index.server';
import { authorize } from '../pipe/middleware/shared/authorize.server';
import { omitId } from 'rizom/utils/object';
import { findDocumentRaw } from '../pipe/middleware/collection/find-document-raw.server';
import { transformDocument } from '../pipe/middleware/shared/transform.server';
import { hooksBeforeRead } from '../pipe/middleware/collection/hooks-before-read.server';

type Args = {
	id: string;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	api: LocalAPI;
	event: RequestEvent;
	adapter: Adapter;
	depth?: number;
};

export const findById = async <T extends RegisterCollection[CollectionSlug]>(args: Args) => {
	//
	const findByIdOperation = createPipe({
		...omitId(args),
		data: { id: args.id },
		operation: 'read',
		internal: {}
	});

	const result = await findByIdOperation
		.use(authorize, findDocumentRaw, transformDocument, hooksBeforeRead())
		.run();

	return result.document as T;
};
