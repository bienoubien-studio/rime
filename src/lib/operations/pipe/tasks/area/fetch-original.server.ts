import type { CompiledArea } from 'rizom/types/config';
import type { Task } from '../../index.server';

export const fetchOriginal: Task<CompiledArea> = async (ctx, next) => {
	ctx.original = await ctx.api.area(ctx.config.slug).find({ locale: ctx.locale });
	await next();
};
