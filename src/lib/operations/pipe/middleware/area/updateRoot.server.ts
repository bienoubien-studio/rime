import type { Middleware } from '../../index.server';
import type { CompiledAreaConfig } from 'rizom/types/config';

export const updateRoot: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	ctx.document = await ctx.adapter.area.update({
		slug: ctx.config.slug,
		data: ctx.data!,
		locale: ctx.locale
	});
	await next();
};
