import type { CompiledAreaConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';
import type { GenericDoc } from 'rizom/types';
import { RizomError } from 'rizom/errors';

export const hooksBeforeRead: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	const { rizom } = ctx.event.locals;
	if (ctx.config.hooks?.beforeRead) {
		for (const hook of ctx.config.hooks.beforeRead) {
			const result = await hook({
				operation: 'read',
				config: ctx.config,
				doc: ctx.document!,
				event: ctx.event,
				rizom,
				api: ctx.api
			});
			ctx.event = result.event;
			ctx.document = result.doc;
		}
	}
	await next();
};

export const hooksBeforeUpdate: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	const { rizom } = ctx.event.locals;
	if (!ctx.original) throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');
	if (ctx.config.hooks && ctx.config.hooks.beforeUpdate) {
		for (const hook of ctx.config.hooks.beforeUpdate) {
			const args = await hook({
				operation: 'update',
				config: ctx.config,
				data: ctx.data as Partial<GenericDoc>,
				originalDoc: ctx.original,
				event: ctx.event,
				rizom,
				api: ctx.api
			});
			ctx.data = args.data as Partial<GenericDoc>;
			ctx.event = args.event;
		}
	}
	await next();
};

export const hooksAfterUpdate: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	if (!ctx.original || !ctx.document)
		throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');

	if (ctx.config.hooks && ctx.config.hooks.afterUpdate) {
		for (const hook of ctx.config.hooks.afterUpdate) {
			const args = await hook({
				operation: 'update',
				config: ctx.config,
				doc: ctx.document,
				event: ctx.event,
				rizom: ctx.event.locals.rizom,
				api: ctx.api
			});
			ctx.event = args.event;
		}
	}

	await next();
};
