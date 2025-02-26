import type { CompiledCollectionConfig } from 'rizom/types/config';
import type { Middleware } from '../../index.server';
import { RizomError } from 'rizom/errors';

export const deleteDocument: Middleware<CompiledCollectionConfig> = async (ctx, next) => {
	const id = ctx.data?.id;
	if (!id) throw new RizomError(RizomError.PIPE_ERROR, 'missing id');

	await ctx.adapter.collection.deleteById({ slug: ctx.config.slug, id });

	await next();
};
