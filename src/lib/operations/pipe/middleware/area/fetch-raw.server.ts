import type { CompiledAreaConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';

export const fetchAreaRaw: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	ctx.data = await ctx.adapter.area.get({
		slug: ctx.config.slug,
		locale: ctx.locale
	});
	await next();
};
