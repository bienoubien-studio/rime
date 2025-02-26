import type { GenericDoc } from 'rizom/types';
import type { Middleware } from '../../index.server';

export const transformDocument: Middleware = async (ctx, next) => {
	ctx.document = await ctx.adapter.transform.doc({
		doc: ctx.data as GenericDoc,
		slug: ctx.config.slug,
		locale: ctx.locale,
		event: ctx.event,
		api: ctx.api,
		depth: ctx.depth
	});
	await next();
};
