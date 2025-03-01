import type { CompiledArea } from 'rizom/types/config';
import type { Task } from '../../index.server';

export const fetchAreaRaw: Task<CompiledArea> = async (ctx, next) => {
	ctx.data = await ctx.adapter.area.get({
		slug: ctx.config.slug,
		locale: ctx.locale
	});
	await next();
};
