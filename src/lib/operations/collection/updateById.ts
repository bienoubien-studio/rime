import { error, type RequestEvent } from '@sveltejs/kit';
import { usersFields } from '$lib/collection/auth/usersFields.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { extractBlocks } from '../preprocess/blocks/extract.server.js';
import { extractRelations } from '../preprocess/relations/extract.server';
import { safeFlattenDoc } from '../../utils/doc.js';
import rizom from '$lib/rizom.server.js';

import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type {
	CollectionHookAfterUpdateArgs,
	CollectionHookBeforeUpdateArgs
} from 'rizom/types/hooks.js';
import type { Dic } from 'rizom/types/utility.js';
import { defineRelationsDiff } from '../preprocess/relations/diff.server.js';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import { defineBlocksDiff } from '../preprocess/blocks/diff.server.js';
import type { RegisterCollection } from 'rizom';
import { extractTreeItems } from '../preprocess/tree/extract.server.js';
import { defineTreeBlocksDiff } from '../preprocess/tree/diff.server.js';
import { treeToString } from 'rizom/fields/tree/index.js';
import { createFieldProvider } from '../preprocess/fields/provider.server.js';
import { mergeWithBlankDocument } from '../preprocess/fill/index.js';

type Args<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
};

export const updateById = async <T extends RegisterCollection[CollectionSlug]>({
	id,
	data,
	locale,
	config,
	api,
	event,
	adapter
}: Args<T>) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	if (event) {
		const authorized = config.access.update(event.locals.user, { id });
		if (!authorized) {
			throw new RizomError(RizomError.UNAUTHORIZED);
		}
	}

	// Get previous doc from storage
	const originalDoc = await api.collection(config.slug).findById({ id, locale });
	if (!originalDoc) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	/** Add Password and ConfirmPassword Configs for Auth collections so validation includes these fields */
	const fields = config.fields;
	if (config.auth) {
		fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	const currentFieldProvider = createFieldProvider({ data, fields });
	const originalDocFieldProvider = createFieldProvider({ data: originalDoc, fields });
	await currentFieldProvider.completeWithDefault({ adapter });

	const { errors } = await currentFieldProvider.validate({
		operation: 'update',
		documentId: id,
		user: event?.locals.user,
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
			try {
				const args = (await hook({
					operation: 'update',
					config,
					api,
					data: currentFieldProvider.data,
					originalDoc,
					event,
					rizom
				})) as CollectionHookBeforeUpdateArgs<T>;
				currentFieldProvider.data = args.data;
				event = args.event;
			} catch (err: any) {
				console.log(err);
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	//////////////////////////////////////////////
	// Update data
	//////////////////////////////////////////////

	const incomingBlocks = extractBlocks({
		fieldProvider: currentFieldProvider
	});

	const incomingTreeItems = extractTreeItems({
		fieldProvider: currentFieldProvider
	});

	await adapter.collection.update({
		slug: config.slug,
		id,
		data: currentFieldProvider.data,
		locale
	});

	/////////////////////////////////////////////
	// Handle blocks
	//////////////////////////////////////////////

	let existingBlocks = extractBlocks({
		fieldProvider: originalDocFieldProvider
	}).filter((block) => {
		// filter existing blocks not present in incoming data to not delete
		return typeof currentFieldProvider.getValue(block.path!) !== 'undefined';
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
		parentId: id,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/////////////////////////////////////////////
	// Tree blocks handling
	//////////////////////////////////////////////

	let existingTreeItems = extractTreeItems({
		fieldProvider: originalDocFieldProvider
	}).filter((item) => {
		// filter existing tree items not present in incoming data to not delete
		return typeof currentFieldProvider.getValue(item.path!) !== 'undefined';
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
		parentId: id,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/////////////////////////////////////////////
	// Relation handling
	//////////////////////////////////////////////

	/** Get existing relations */
	let existingRelations = await adapter.relations
		.getAll({
			parentSlug: config.slug,
			parentId: id,
			locale
		})
		.then((relations) =>
			// filter existing relations not present in incoming data to not delete
			relations.filter((relation) => {
				return typeof currentFieldProvider.getValue(relation.path!) !== 'undefined';
			})
		);

	/** Get relations in data */
	const incomingRelations = extractRelations({
		parentId: id,
		fieldProvider: currentFieldProvider,
		locale
	});

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
			parentId: id,
			relations: relationsDiff.toAdd
		});
	}

	const rawDoc = (await adapter.collection.findById({ slug: config.slug, id, locale })) as T;

	if (!rawDoc) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	const doc = await adapter.transform.doc<T>({
		doc: rawDoc,
		slug: config.slug,
		locale,
		event,
		api
	});

	//////////////////////////////////////////////
	// Hooks AfterUpdate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.afterUpdate) {
		for (const hook of config.hooks.afterUpdate) {
			try {
				const args = (await hook({
					operation: 'update',
					config,
					api,
					event,
					doc,
					rizom
				})) as CollectionHookAfterUpdateArgs<T>;
				event = args.event;
			} catch (err: any) {
				console.log(err);
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	return doc;
};
