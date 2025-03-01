import type { Task } from '../../index.server';
import type { GenericDoc } from 'rizom/types';
import type {
	AreaHookAfterUpdateArgs,
	AreaHookBeforeReadArgs,
	AreaHookBeforeUpdateArgs
} from 'rizom/types/hooks';
import type { CompiledArea } from 'rizom/types/config';
import { RizomError } from 'rizom/errors';

export const hooksBeforeRead: Task<CompiledArea> = async (ctx, next) => {
	const { rizom } = ctx.event.locals;

	const hooks = ctx.config.hooks?.beforeRead;
	if (!hooks) {
		return await next();
	}

	try {
		let currentParams: AreaHookBeforeReadArgs = {
			operation: 'read',
			config: ctx.config,
			doc: ctx.document!,
			event: ctx.event,
			rizom,
			api: ctx.api
		};

		for (const hook of hooks) {
			const result = await hook(currentParams);
			// Update params for next hook
			currentParams = {
				...currentParams,
				doc: result.doc,
				event: result.event
			};
		}

		// Update context with final results
		ctx.document = currentParams.doc;
		ctx.event = currentParams.event;
	} catch (err: any) {
		throw new RizomError(RizomError.HOOK, err.message);
	}

	await next();
};

export const hooksBeforeUpdate: Task<CompiledArea> = async (ctx, next) => {
	const { rizom } = ctx.event.locals;

	if (!ctx.original) {
		throw new RizomError(RizomError.PIPE_ERROR, 'Missing original document');
	}

	const hooks = ctx.config.hooks?.beforeUpdate;
	if (!hooks) {
		return await next();
	}

	try {
		let currentParams: AreaHookBeforeUpdateArgs = {
			operation: 'update',
			config: ctx.config,
			data: ctx.data as Partial<GenericDoc>,
			originalDoc: ctx.original,
			event: ctx.event,
			rizom,
			api: ctx.api
		};

		for (const hook of hooks) {
			const hookResult = await hook(currentParams);
			// Update the params for the next hook
			currentParams = {
				...currentParams,
				data: hookResult.data,
				event: hookResult.event
			};
		}

		// Update context with final results
		ctx.data = currentParams.data;
		ctx.event = currentParams.event;
	} catch (err: any) {
		throw new RizomError(RizomError.HOOK, err.message);
	}

	await next();
};

export const hooksAfterUpdate: Task<CompiledArea> = async (ctx, next) => {
	if (!ctx.original || !ctx.document) {
		throw new RizomError(RizomError.PIPE_ERROR, 'Missing original or document');
	}

	const hooks = ctx.config.hooks?.afterUpdate;
	if (!hooks) {
		return await next();
	}

	try {
		let currentParams: AreaHookAfterUpdateArgs = {
			operation: 'update',
			config: ctx.config,
			doc: ctx.document,
			event: ctx.event,
			rizom: ctx.event.locals.rizom,
			api: ctx.api
		};

		for (const hook of hooks) {
			const result = await hook(currentParams);
			// Update params for next hook
			currentParams = {
				...currentParams,
				event: result.event
			};
		}

		// Update context with final event
		ctx.event = currentParams.event;
	} catch (err: any) {
		throw new RizomError(RizomError.HOOK, err.message);
	}

	await next();
};
