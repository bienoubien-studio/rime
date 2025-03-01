import { RizomError } from 'rizom/errors';
import type { Task } from '../../index.server';
import type { CompiledCollection } from 'rizom/types/config';

export const updateRoot: Task<CompiledCollection> = async (ctx, next) => {
	const id = ctx.data?.id;
	if (!id) throw new RizomError(RizomError.NOT_FOUND);
	const { config, data, locale } = ctx;

	if (!data) throw new RizomError(RizomError.PIPE_ERROR, 'missing data');

	await ctx.adapter.collection.update({
		id,
		slug: config.slug,
		data: data,
		locale: locale
	});

	if (!ctx.document) {
		ctx.document = {
			id,
			title: data.title || ctx.original?.title || '[undefined]',
			_type: ctx.config.slug,
			_prototype: 'collection'
		};
	}

	await next();
};
