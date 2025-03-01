import { RizomError } from 'rizom/errors';
import type { Task } from '../../index.server';
import type { CompiledCollection } from 'rizom/types/config';

export const insertRoot: Task<CompiledCollection> = async (ctx, next) => {
	if (!ctx.data) throw new RizomError(RizomError.PIPE_ERROR, 'missing data');
	const createdId = await ctx.adapter.collection.insert({
		slug: ctx.config.slug,
		data: ctx.data,
		locale: ctx.locale
	});
	ctx.data.id = createdId;
	if (!ctx.document) {
		ctx.document = {
			id: createdId,
			title: ctx.data.title || '[undefined]',
			_type: ctx.config.slug,
			_prototype: 'collection'
		};
	} else {
		ctx.document.id = createdId;
	}
	await next();
};
