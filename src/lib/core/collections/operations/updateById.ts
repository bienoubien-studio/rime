import type { CompiledCollection } from '$lib/core/config/types/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { Hook, OperationContext } from '$lib/core/operations/hooks/index.js';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import type { DeepPartial } from '$lib/util/types.js';
import type { RequestEvent } from '@sveltejs/kit';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';

type Args<T> = {
	id: string;
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	isFallbackLocale?: string | undefined;
	isSystemOperation?: boolean;
};

/**
 * Updates a document by ID
 */
export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	//
	const { event, locale, id, draft, isFallbackLocale = undefined, isSystemOperation } = args;
	const { rizom } = event.locals;
	let { data } = args;
	let config = args.config;

	console.log('#### update');

	// Set hooks context
	let context: OperationContext<CollectionSlug> = {
		params: {
			id,
			versionId: args.versionId,
			draft,
			locale
		},
		isSystemOperation,
		isFallbackLocale
	};

	for (const hook of config.hooks?.beforeOperation || []) {
		const result = await hook({
			config,
			operation: 'update',
			event,
			context
		});
		context = result.context;
	}

	const hooksBeforeUpdate = config.hooks?.beforeUpdate as Hook<CollectionSlug>[];
	for (const hook of hooksBeforeUpdate || []) {
		const result = await hook({
			data: data as RegisterCollection[CollectionSlug],
			config,
			operation: 'update',
			event,
			context
		});
		config = result.config;
		context = result.context;
		data = result.data as Partial<T>;
	}

	const makeMessage = (name: string) => `missing ${name} @uppdateById`;
	if (!context.configMap) throw new RizomError(RizomError.OPERATION_ERROR, makeMessage('configMap'));
	if (!context.originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, makeMessage('originalConfigMap'));
	if (!context.originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, makeMessage('originalDoc'));
	if (!context.versionOperation) throw new RizomError(RizomError.OPERATION_ERROR, makeMessage('versionOperation'));
	if (!context.params.versionId) throw new RizomError(RizomError.OPERATION_ERROR, makeMessage('versionId'));

	const incomingPaths = Object.keys(context.configMap);

	const { id: updatedId } = await rizom.adapter.collection.update({
		id,
		versionId: context.params.versionId,
		slug: config.slug,
		data: data,
		locale: locale,
		versionOperation: context.versionOperation
	});

	const blocksDiff = await saveBlocks({
		context,
		ownerId: context.params.versionId,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config
	});

	const treeDiff = await saveTreeBlocks({
		context,
		ownerId: context.params.versionId,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config
	});

	await saveRelations({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	const document = await rizom.collection(config.slug).findById({
		id: updatedId,
		locale,
		versionId: context.params.versionId
	});

	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			data: data as RegisterCollection[CollectionSlug],
			config,
			operation: 'update',
			event,
			context
		});
	}

	return document as T;
};
