import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';
import type { GenericDoc } from 'rizom/types/doc';
import type { CompiledAreaConfig } from 'rizom/types/config';
import { createPipe } from '../pipe/index.server';
import { authorize } from '../pipe/middleware/shared/authorize.server';
import { fetchAreaRaw } from '../pipe/middleware/area/fetch-raw.server';
import { transformDocument } from '../pipe/middleware/shared/transform.server';
import { hooksBeforeRead } from '../pipe/middleware/area/hooks.server';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledAreaConfig;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
};

export const find = async <T extends GenericDoc = GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const findProcess = createPipe({
		...args,
		internal: {},
		operation: 'read'
	});

	const result = await findProcess
		.use(authorize, fetchAreaRaw, transformDocument, hooksBeforeRead)
		.run();

	return result.document as T;
};
