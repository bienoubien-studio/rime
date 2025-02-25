import { RizomError } from 'rizom/errors';
import type { Middleware } from 'rizom/operations/pipe/index.server';
import { extractTreeBlocks } from './extract.server';
import type { TreeBlock } from 'rizom/types/doc';
import type { WithRequired } from 'rizom/types/utility';
import { defineTreeBlocksDiff } from './diff.server';

export const saveTreeBlocks: Middleware = async (ctx, next) => {
	const incomingResolver = ctx.internal.incomingFieldsResolver;
	const configMap = ctx.internal.configMap;

	if (!incomingResolver || !configMap) throw new RizomError(RizomError.PIPE_ERROR);

	const incomingTreeBlocks = extractTreeBlocks({
		resolver: incomingResolver,
		configMap: configMap
	});

	let existingTreeBlocks: WithRequired<TreeBlock, 'path'>[] = [];
	if (ctx.original && ctx.internal.originalFieldsResolver)
		existingTreeBlocks = extractTreeBlocks({
			resolver: ctx.internal.originalFieldsResolver,
			configMap: configMap
		}).filter((block) => {
			// filter existing blocks not present in incoming data to not delete
			return typeof incomingResolver.getValue(block.path!) !== 'undefined';
		});

	const treeDiff = defineTreeBlocksDiff({
		existingBlocks: existingTreeBlocks,
		incomingBlocks: incomingTreeBlocks
	});

	if (treeDiff.toDelete.length) {
		await Promise.all(
			treeDiff.toDelete.map((block) =>
				ctx.adapter.tree.delete({ parentSlug: ctx.config.slug, block })
			)
		);
	}

	if (treeDiff.toAdd.length) {
		const parentId = ctx.document?.id;
		if (!parentId) throw new RizomError(RizomError.PIPE_ERROR, 'missing docuemnt id');
		await Promise.all(
			treeDiff.toAdd.map((block) =>
				ctx.adapter.tree.create({
					parentSlug: ctx.config.slug,
					parentId,
					block,
					locale: ctx.locale
				})
			)
		);
	}

	if (treeDiff.toUpdate.length) {
		await Promise.all(
			treeDiff.toUpdate.map((block) =>
				ctx.adapter.tree.update({ parentSlug: ctx.config.slug, block, locale: ctx.locale })
			)
		);
	}

	ctx.internal.treeDiff = treeDiff;

	await next();
};
