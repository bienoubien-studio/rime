import type { RequestEvent } from '@sveltejs/kit';
import type { AreaHooks, LocalAPI, CompiledArea, GenericDoc, Adapter } from 'rizom/types';
import { operationRunner } from '../pipe/index.server';
import { authorize } from '../pipe/tasks/shared/authorize.server';
import { fetchAreaRaw } from '../pipe/tasks/area/fetch-raw.server';
import { transformDocument } from '../pipe/tasks/shared/transform.server';
import { processHooks } from '../pipe/tasks/shared/hooks.server';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
};

export const find = async <T extends GenericDoc = GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const operation = operationRunner({
		...args,
		internal: {},
		operation: 'read'
	});

	const result = await operation
		.use(
			//
			authorize,
			fetchAreaRaw,
			transformDocument,
			processHooks<AreaHooks>('beforeRead')
		)
		.run();

	return result.document as T;
};
