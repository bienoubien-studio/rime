import type { CompiledAreaConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';

export const fetchOriginal: Middleware<CompiledAreaConfig> = async (ctx, next) => {
	ctx.original = await ctx.api.area(ctx.config.slug).find({ locale: ctx.locale });
	await next();
};
