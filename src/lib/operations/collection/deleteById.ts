import type { RequestEvent } from '@sveltejs/kit';
import rizom from '$lib/rizom.server.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type {
	CollectionHookAfterDeleteArgs,
	CollectionHookBeforeDeleteArgs
} from 'rizom/types/hooks.js';
import { RizomError } from 'rizom/errors/index.js';

type DeleteById = (args: {
	id: string;
	config: CompiledCollectionConfig;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
}) => Promise<string>;

export const deleteById: DeleteById = async ({ id, config, event, adapter, api }) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	const authorized = config.access.delete(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let doc = await adapter.collection.findById({ slug: config.slug, id });

	if (!doc) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	//////////////////////////////////////////////
	// Hooks BeforeDelete
	//////////////////////////////////////////////
	if (config.hooks && config.hooks.beforeDelete) {
		for (const hook of config.hooks.beforeDelete) {
			try {
				const args = (await hook({
					operation: 'delete',
					config,
					doc,
					event,
					rizom,
					api
				})) as CollectionHookBeforeDeleteArgs;
				doc = args.doc;
				event = args.event;
			} catch (err: any) {
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	// Delete
	await adapter.collection.deleteById({ slug: config.slug, id });

	//////////////////////////////////////////////
	// Hooks AfterDelete
	//////////////////////////////////////////////
	if (config.hooks && config.hooks.afterDelete) {
		for (const hook of config.hooks.afterDelete) {
			try {
				const args = (await hook({
					operation: 'delete',
					config,
					doc,
					event,
					rizom,
					api
				})) as CollectionHookAfterDeleteArgs;
				doc = args.doc;
				event = args.event;
			} catch (err: any) {
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	return id;
};
