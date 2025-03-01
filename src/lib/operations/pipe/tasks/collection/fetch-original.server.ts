import type { CompiledCollection } from 'rizom/types/config';
import type { Task } from '../../index.server';
import { RizomError } from 'rizom/errors';

export const fetchOriginal: Task<CompiledCollection> = async (ctx, next) => {
	const id = ctx.data?.id;
	if (!id) throw new RizomError(RizomError.PIPE_ERROR, 'missing id');

	const original = await ctx.api.collection(ctx.config.slug).findById({
		locale: ctx.locale,
		id
	});

	if (!original) throw new RizomError(RizomError.NOT_FOUND);

	ctx.original = original;
	await next();
};
