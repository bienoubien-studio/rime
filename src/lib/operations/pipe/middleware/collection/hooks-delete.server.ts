import type { CompiledCollectionConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';
import { RizomError } from 'rizom/errors';
import type { CollectionHookBeforeDelete, CollectionHookDeleteArgs } from 'rizom/types';

type HookType = 'before' | 'after';

export const hooksDelete = (
	hookType: HookType,
	args?: { multiple: boolean }
): Middleware<CompiledCollectionConfig> => {
	//
	return async (ctx, next) => {
		const hookKey = `${hookType}Delete` as 'beforeDelete' | 'afterDelete';
		const hooks = ctx.config?.hooks?.[hookKey];

		if (!hooks) {
			return await next();
		}

		const { rizom } = ctx.event.locals;
		const { config, event, api } = ctx;
		const baseParams: Omit<CollectionHookDeleteArgs, 'doc'> = {
			operation: 'delete',
			config,
			event,
			rizom,
			api
		};

		if (args?.multiple && ctx.documents) {
			ctx.documents = await processMultipleDocuments(ctx.documents, hooks, baseParams);
		} else if (ctx.document) {
			ctx.document = await processDocumentHooksDelete({
				hooks,
				params: { ...baseParams, doc: ctx.document }
			});
		}

		await next();
	};
};

const processMultipleDocuments = async (
	documents: any[],
	hooks: CollectionHookBeforeDelete<any>[],
	baseParams: Omit<CollectionHookDeleteArgs, 'doc'>
) => {
	return Promise.all(
		documents.map((doc) =>
			processDocumentHooksDelete({
				hooks,
				params: { ...baseParams, doc }
			})
		)
	);
};

const processDocumentHooksDelete = async ({
	hooks,
	params
}: {
	hooks: CollectionHookBeforeDelete<any>[];
	params: CollectionHookDeleteArgs;
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
