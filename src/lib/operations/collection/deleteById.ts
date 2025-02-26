import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterCollection } from 'rizom';
import type { CollectionSlug, LocalAPI, Adapter, CompiledCollectionConfig } from 'rizom/types';
import { omitId } from 'rizom/utils/object';
import { createPipe } from '../pipe/index.server';
import { authorize } from '../pipe/middleware/shared/authorize.server';
import { findDocumentRaw } from '../pipe/middleware/collection/find-document-raw.server';
import { deleteDocument } from '../pipe/middleware/collection/delete-document.server';
import { hooksDelete } from '../pipe/middleware/collection/hooks-delete.server';

type DeleteArgs = {
	id: string;
	config: CompiledCollectionConfig;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
};

export const deleteById = async <T extends RegisterCollection[CollectionSlug]>(
	args: DeleteArgs
): Promise<string> => {
	//
	const deleteByIdOperation = createPipe({
		...omitId(args),
		data: { id: args.id },
		operation: 'delete',
		internal: {}
	});

	const result = await deleteByIdOperation
		.use(authorize, findDocumentRaw, hooksDelete('before'), deleteDocument, hooksDelete('after'))
		.run();

	return args.id;
};
