import type { Middleware } from '../../index.server';

export const transformAllDocuments: Middleware = async (ctx, next) => {
	const { api, locale, event, depth } = ctx;
	ctx.documents = await ctx.adapter.transform.docs({
		docs: ctx.documents || [],
		slug: ctx.config.slug,
		api,
		locale,
		event,
		depth
	});
	await next();
};
