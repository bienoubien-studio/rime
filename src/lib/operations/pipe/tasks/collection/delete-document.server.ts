import type { CompiledCollection } from 'rizom/types/config';
import type { Task } from '../../index.server';
import { RizomError } from 'rizom/errors';

export const deleteDocument: Task<CompiledCollection> = async (ctx, next) => {
	const id = ctx.data?.id;
	if (!id) throw new RizomError(RizomError.PIPE_ERROR, 'missing id');

	await ctx.adapter.collection.deleteById({ slug: ctx.config.slug, id });

	await next();
};
