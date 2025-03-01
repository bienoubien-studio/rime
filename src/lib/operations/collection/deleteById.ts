import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterCollection } from 'rizom';
import type { CollectionSlug, LocalAPI, Adapter, CompiledCollection } from 'rizom/types';
import { RizomError } from 'rizom/errors';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
};

export const deleteById = async <T extends RegisterCollection[CollectionSlug]>(
	args: DeleteArgs
): Promise<string> => {
	const { event, id, config, api, adapter } = args;

	const authorized = config.access.delete(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let document = (await adapter.collection.findById({ slug: config.slug, id })) as T;
	if (!document) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	for (const hook of config.hooks?.beforeDelete || []) {
		await hook({
			doc: document,
			config,
			operation: 'delete',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	await adapter.collection.deleteById({ slug: config.slug, id });

	for (const hook of config.hooks?.afterDelete || []) {
		await hook({
			doc: document,
			config,
			operation: 'delete',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	return args.id;
};
