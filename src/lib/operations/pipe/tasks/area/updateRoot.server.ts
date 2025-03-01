import type { Task } from '../../index.server';
import type { CompiledArea } from 'rizom/types/config';

export const updateRoot: Task<CompiledArea> = async (ctx, next) => {
	ctx.document = await ctx.adapter.area.update({
		slug: ctx.config.slug,
		data: ctx.data!,
		locale: ctx.locale
	});
	await next();
};
