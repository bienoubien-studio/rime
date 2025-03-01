import type { Context, Task } from '../../index.server';
import type {
	CollectionHooks,
	AreaHooks,
	GenericDoc,
	CollectionHookBeforeRead,
	CollectionHookBeforeCreate,
	CollectionHookAfterCreate,
	CollectionHookBeforeUpdate,
	CollectionHookAfterUpdate,
	CollectionHookBeforeDelete,
	CollectionHookAfterDelete,
	AreaHookBeforeRead,
	AreaHookBeforeUpdate,
	AreaHookAfterUpdate
} from 'rizom/types';
import { RizomError } from 'rizom/errors';

type CollectionHookType =
	| CollectionHookBeforeRead
	| CollectionHookBeforeCreate
	| CollectionHookAfterCreate
	| CollectionHookBeforeUpdate
	| CollectionHookAfterUpdate
	| CollectionHookBeforeDelete
	| CollectionHookAfterDelete;
type AreaHookType = AreaHookBeforeRead | AreaHookBeforeUpdate | AreaHookAfterUpdate;
type HookType = CollectionHookType | AreaHookType;

export const processHooks =
	<T extends CollectionHooks<GenericDoc> | AreaHooks>(hookType: keyof T): Task =>
	async (ctx, next) => {
		const hooks = (ctx.config.hooks as T)?.[hookType] as HookType[] | undefined;
		if (!hooks?.length) return await next();

		const hookBaseArgs = {
			operation: ctx.operation,
			config: ctx.config,
			event: ctx.event,
			rizom: ctx.event.locals.rizom,
			api: ctx.api
		};

		try {
			const hookArgs = {
				...hookBaseArgs,
				doc: ctx.document ?? undefined,
				data: ctx.document ? undefined : ctx.data,
				originalDoc: ctx.original
			};

			const hookResult = await processDocument(hooks, hookArgs);

			if ('doc' in hookResult) ctx.document = hookResult.doc;
			if ('data' in hookResult) ctx.data = hookResult.data;
			if ('event' in hookResult) ctx.event = hookResult.event;
		} catch (err: any) {
			throw new RizomError(RizomError.HOOK, err.message);
		}

		await next();
	};

async function processDocument(hooks: HookType[], params: any) {
	let currentParams = params;

	for (const hook of hooks) {
		const result = await hook(currentParams);
		currentParams = { ...currentParams, ...result };
	}

	return currentParams;
}
