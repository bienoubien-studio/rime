import rizom from '$lib/rizom.server.js';
import { extractBlocks } from '../preprocess/blocks/extract.server.js';
import { extractRelations } from '../preprocess/relations/extract.server.js';
import { safeFlattenDoc } from '../../utils/doc.js';
import { buildConfigMap } from '../preprocess/config/map.js';

import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledAreaConfig } from 'rizom/types/config.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { Dic } from 'rizom/types/utility.js';
import { defineRelationsDiff } from '../preprocess/relations/diff.server.js';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import { defineBlocksDiff } from '../preprocess/blocks/diff.server.js';
import { extractTreeItems } from '../preprocess/tree/extract.server.js';
import { defineTreeBlocksDiff } from '../preprocess/tree/diff.server.js';
import { createFieldProvider } from '../preprocess/fields/provider.server.js';

type UpdateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledAreaConfig;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
};

export const update = async <T extends GenericDoc = GenericDoc>({
	data,
	locale,
	config,
	api,
	event,
	adapter
}: UpdateArgs<T>) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////

	const authorized = config.access.update(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const originalDoc = await api.area(config.slug).find({ locale });

	const fieldProvider = createFieldProvider({ data, fields: config.fields });
	const originalDocFieldProvider = createFieldProvider({
		data: originalDoc,
		fields: config.fields
	});

	const { errors } = await fieldProvider.validate({
		operation: 'update',
		documentId: originalDoc.id,
		user: event.locals.user,
		slug: config.slug,
		locale,
		api
	});

	if (errors) {
		throw new RizomFormError(errors);
	}

	//////////////////////////////////////////////
	// Hooks BeforeUpdate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeUpdate) {
		for (const hook of config.hooks.beforeUpdate) {
			const args = await hook({
				operation: 'update',
				config,
				data: fieldProvider.data,
				originalDoc,
				event,
				rizom,
				api
			});
			fieldProvider.data = args.data as Partial<T>;
			event = args.event;
		}
	}

	//////////////////////////////////////////////
	// Update data
	//////////////////////////////////////////////

	const incomingBlocks = extractBlocks({
		fieldProvider
	});

	const incomingTreeItems = extractTreeItems({
		fieldProvider
	});

	let doc = await adapter.area.update({ slug: config.slug, data, locale });

	/////////////////////////////////////////////
	// Blocks handling
	//////////////////////////////////////////////

	const existingBlocks = extractBlocks({
		fieldProvider: originalDocFieldProvider
	}).filter((block) => {
		// filter existing blocks not present in incoming data to not delete
		return typeof fieldProvider.getValue(block.path!) !== 'undefined';
	});

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		incomingBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: config.slug, block }))
		);
	}

	if (blocksDiff.toAdd.length) {
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				adapter.blocks.create({ parentSlug: config.slug, parentId: originalDoc.id, block, locale })
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) =>
				adapter.blocks.update({ parentSlug: config.slug, block, locale })
			)
		);
	}

	/** Delete relations from deletedBlocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/////////////////////////////////////////////
	// Tree handling
	//////////////////////////////////////////////

	const existingTreeItems = extractTreeItems({
		fieldProvider: originalDocFieldProvider
	}).filter((item) => {
		// filter existing tree items not present in incoming data to not delete
		return typeof fieldProvider.getValue(item.path!) !== 'undefined';
	});

	const treeDiff = defineTreeBlocksDiff({
		existingBlocks: existingTreeItems,
		incomingBlocks: incomingTreeItems
	});

	if (treeDiff.toDelete.length) {
		await Promise.all(
			treeDiff.toDelete.map((block) => adapter.tree.delete({ parentSlug: config.slug, block }))
		);
	}

	if (treeDiff.toAdd.length) {
		await Promise.all(
			treeDiff.toAdd.map((block) =>
				adapter.tree.create({ parentSlug: config.slug, parentId: originalDoc.id, block, locale })
			)
		);
	}

	if (treeDiff.toUpdate.length) {
		await Promise.all(
			treeDiff.toUpdate.map((block) =>
				adapter.tree.update({ parentSlug: config.slug, block, locale })
			)
		);
	}

	/** Delete relations from deletedTreeItems */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Delete relations from deletedTreeBlocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Get existing relations */
	const existingRelations = await adapter.relations
		.getAll({
			parentSlug: config.slug,
			parentId: doc.id,
			locale
		})
		.then((relations) =>
			relations.filter((relation) => {
				return typeof fieldProvider.getValue(relation.path!) !== 'undefined';
			})
		);

	/** Get relations in data */
	const incomingRelations = extractRelations({ parentId: doc.id, fieldProvider, locale });

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		incomingRelations,
		locale
	});

	if (relationsDiff.toDelete.length) {
		await adapter.relations.delete({
			parentSlug: config.slug,
			relations: relationsDiff.toDelete
		});
	}

	if (relationsDiff.toUpdate.length) {
		await adapter.relations.update({
			parentSlug: config.slug,
			relations: relationsDiff.toUpdate
		});
	}

	if (relationsDiff.toAdd.length) {
		await adapter.relations.create({
			parentSlug: config.slug,
			parentId: doc.id,
			relations: relationsDiff.toAdd
		});
	}

	const rawDoc = (await adapter.area.get({ slug: config.slug, locale })) as T;
	doc = await adapter.transform.doc<T>({ doc: rawDoc, slug: config.slug, locale, event, api });

	//////////////////////////////////////////////
	// Hooks AfterUpdate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.afterUpdate) {
		for (const hook of config.hooks.afterUpdate) {
			const args = await hook({
				operation: 'update',
				config,
				doc,
				event,
				rizom,
				api
			});
			event = args.event;
		}
	}

	return doc as T;
};
