import type { CompiledCollectionConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';
import { RizomError } from 'rizom/errors';
import type { CollectionHookBeforeRead, CollectionHookBeforeReadArgs } from 'rizom/types';

export const hooksBeforeRead = (args?: {
	multiple: boolean;
}): Middleware<CompiledCollectionConfig> => {
	return async (ctx, next) => {
		const hooks = ctx.config.hooks?.beforeRead;
		if (!hooks) return await next();

		const { rizom } = ctx.event.locals;
		const { config, event, api } = ctx;
		const baseParams: Omit<CollectionHookBeforeReadArgs, 'doc'> = {
			operation: 'read',
			config,
			event,
			rizom,
			api
		};

		if (args?.multiple && ctx.documents) {
			ctx.documents = await processMultipleDocuments(ctx.documents, hooks, baseParams);
		} else if (ctx.document) {
			ctx.document = await processDocumentHooksBeforeRead({
				hooks,
				params: { ...baseParams, doc: ctx.document }
			});
		}

		await next();
	};
};

const processMultipleDocuments = async (
	documents: any[],
	hooks: CollectionHookBeforeRead<any>[],
	baseParams: Omit<CollectionHookBeforeReadArgs, 'doc'>
) => {
	return Promise.all(
		documents.map((doc) =>
			processDocumentHooksBeforeRead({
				hooks,
				params: { ...baseParams, doc }
			})
		)
	);
};

const processDocumentHooksBeforeRead = async ({
	hooks,
	params
}: {
	hooks: CollectionHookBeforeRead<any>[];
	params: CollectionHookBeforeReadArgs;
}) => {
	let { doc } = params;

	for (const hook of hooks) {
		try {
			const result = await hook(params);
			doc = result.doc;
		} catch (err: any) {
			throw new RizomError(RizomError.HOOK, err.message);
		}
	}

	return doc;
};
