import { RizomError } from 'rizom/errors';
import type { Middleware } from 'rizom/operations/pipe/index.server';
import { extractBlocks } from './extract.server';
import type { GenericBlock } from 'rizom/types';
import { defineBlocksDiff } from './diff.server';

export const saveBlocks: Middleware = async (ctx, next) => {
	const incomingResolver = ctx.internal.incomingFieldsResolver;
	const configMap = ctx.internal.configMap;

	if (!incomingResolver || !configMap) throw new RizomError(RizomError.PIPE_ERROR);

	const incomingBlocks = extractBlocks({
		resolver: incomingResolver,
		configMap: configMap
	});

	let existingBlocks: GenericBlock[] = [];
	if (ctx.original && ctx.internal.originalFieldsResolver)
		existingBlocks = extractBlocks({
			resolver: ctx.internal.originalFieldsResolver,
			configMap: configMap
		}).filter((block) => {
			// filter existing blocks not present in incoming data to not delete
			return typeof incomingResolver.getValue(block.path!) !== 'undefined';
		});

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		incomingBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) =>
				ctx.adapter.blocks.delete({ parentSlug: ctx.config.slug, block })
			)
		);
	}

	if (blocksDiff.toAdd.length) {
		const parentId = ctx.document?.id;
		if (!parentId) throw new RizomError(RizomError.PIPE_ERROR, 'missing docuemnt id');
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				ctx.adapter.blocks.create({
					parentSlug: ctx.config.slug,
					parentId,
					block,
					locale: ctx.locale
				})
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) =>
				ctx.adapter.blocks.update({ parentSlug: ctx.config.slug, block, locale: ctx.locale })
			)
		);
	}

	ctx.internal.blocksDiff = blocksDiff;

	await next();
};
