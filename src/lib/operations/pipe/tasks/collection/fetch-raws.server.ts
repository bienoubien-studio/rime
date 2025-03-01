import type { CompiledCollection } from 'rizom/types/config';
import type { Task } from '../../index.server';
import { RizomError } from 'rizom/errors';

export const fetchRaws: Task<CompiledCollection> = async (ctx, next) => {
	const { locale, query, sort, limit } = ctx;
	if (!query) throw new RizomError(RizomError.PIPE_ERROR, 'should never happen');

	if (query) {
		ctx.documents = await ctx.adapter.collection.query({
			slug: ctx.config.slug,
			query,
			sort,
			limit,
			locale
		});
	} else {
		ctx.documents = await ctx.adapter.collection.findAll({
			slug: ctx.config.slug,
			sort,
			limit,
			locale
		});
	}

	await next();
};
