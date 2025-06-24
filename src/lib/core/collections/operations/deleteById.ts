import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { HookContext } from '$lib/core/config/types/hooks.js';
import { logger } from '$lib/core/logger/index.server.js';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
};

export const deleteById = async <T extends GenericDoc>(args: DeleteArgs): Promise<string> => {
	const { event, id, config } = args;
	const { rizom } = event.locals;
	let context: HookContext = { params : { id }}

	for (const hook of config.hooks?.beforeOperation || []) {
		const result = await hook({
			config,
			operation: 'delete',
			rizom: event.locals.rizom,
			event,
			context
		});
		context = result.context
	}

	const document = (await rizom.adapter.collection.findById({ slug: config.slug, id, draft: true })) as T;
	if (!document) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	for (const hook of config.hooks?.beforeDelete || []) {
		const result = await hook({
			doc: document,
			config,
			operation: 'delete',
			rizom: event.locals.rizom,
			event,
			context
		});
		context = result.context
	}

	await rizom.adapter.collection.deleteById({ slug: config.slug, id });

	for (const hook of config.hooks?.afterDelete || []) {
		const result = await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'delete',
			rizom: event.locals.rizom,
			event,
			context
		});
		context = result.context
	}

	return args.id;
};
