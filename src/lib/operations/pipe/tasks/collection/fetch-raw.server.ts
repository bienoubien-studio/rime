import type { CompiledCollection } from 'rizom/types/config';
import type { Task } from '../../index.server';
import { RizomError } from 'rizom/errors';

export const fetchRaw: Task<CompiledCollection> = async (ctx, next) => {
	const id = ctx.data?.id;
	if (!id) throw new RizomError(RizomError.NOT_FOUND);

	const document = await ctx.adapter.collection.findById({
		slug: ctx.config.slug,
		id,
		locale: ctx.locale
	});

	if (!document) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	ctx.document = document;

	await next();
};
