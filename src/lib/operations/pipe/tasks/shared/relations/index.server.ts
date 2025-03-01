import { RizomError } from 'rizom/errors';
import type { Task } from 'rizom/operations/pipe/index.server';
import { extractRelations } from './extract.server';
import { defineRelationsDiff } from './diff.server';

export const saveRelations: Task = async (ctx, next) => {
	const incomingResolver = ctx.internal.incomingFieldsResolver;
	const { configMap, blocksDiff, treeDiff } = ctx.internal;
	const document = ctx.document;

	if (!incomingResolver || !configMap || !blocksDiff || !treeDiff || !document?.id)
		throw new RizomError(RizomError.PIPE_ERROR);

	/** Delete relations from deletedBlocks */
	await ctx.adapter.relations.deleteFromPaths({
		parentSlug: ctx.config.slug,
		parentId: document.id,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Delete relations from deletedTreeItems */
	await ctx.adapter.relations.deleteFromPaths({
		parentSlug: ctx.config.slug,
		parentId: document.id,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Get existing relations */
	const existingRelations = await ctx.adapter.relations
		.getAll({
			parentSlug: ctx.config.slug,
			parentId: document.id,
			locale: ctx.locale
		})
		.then((relations) =>
			relations.filter((relation) => {
				return typeof incomingResolver.getValue(relation.path!) !== 'undefined';
			})
		);

	/** Get relations in data */
	const incomingRelations = extractRelations({
		parentId: document.id,
		resolver: incomingResolver,
		configMap,
		locale: ctx.locale
	});

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		incomingRelations,
		locale: ctx.locale
	});

	if (relationsDiff.toDelete.length) {
		await ctx.adapter.relations.delete({
			parentSlug: ctx.config.slug,
			relations: relationsDiff.toDelete
		});
	}

	if (relationsDiff.toUpdate.length) {
		await ctx.adapter.relations.update({
			parentSlug: ctx.config.slug,
			relations: relationsDiff.toUpdate
		});
	}

	if (relationsDiff.toAdd.length) {
		await ctx.adapter.relations.create({
			parentSlug: ctx.config.slug,
			parentId: document.id,
			relations: relationsDiff.toAdd
		});
	}

	ctx.internal.relationsDiff = relationsDiff;

	await next();
};
