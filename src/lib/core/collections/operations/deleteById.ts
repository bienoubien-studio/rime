import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
};

export const deleteById = async <T extends GenericDoc>(args: DeleteArgs): Promise<string> => {
	const { event, id, config } = args;
	const { rizom } = event.locals;

	const authorized = config.access.delete(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const document = (await rizom.adapter.collection.findById({ slug: config.slug, id, draft: true })) as T;
	if (!document) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	for (const hook of config.hooks?.beforeDelete || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'delete',
			rizom: event.locals.rizom,
			event,
			metas:{}
		});
	}

	await rizom.adapter.collection.deleteById({ slug: config.slug, id });

	for (const hook of config.hooks?.afterDelete || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'delete',
			rizom: event.locals.rizom,
			event,
			metas:{}
		});
	}

	return args.id;
};
