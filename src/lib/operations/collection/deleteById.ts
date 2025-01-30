import type { RequestEvent } from '@sveltejs/kit';
import { RizomAccessError } from '../../errors/access.server.js';
import { RizomNotFoundError } from '../../errors/notFound.server.js';
import rizom from '$lib/rizom.server.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomHookError } from 'rizom/errors/hook.server.js';
import type { CollectionHookBeforeDeleteArgs } from 'rizom/types/hooks.js';

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
	if (event) {
		const authorized = config.access.delete(event.locals.user, { id });
		if (!authorized) {
			throw new RizomAccessError('- trying to delete ' + config.slug);
		}
	}

	let doc = await adapter.collection.findById({ slug: config.slug, id });

	if (!doc) {
		throw new RizomNotFoundError();
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
				throw new RizomHookError(err.message);
			}
		}
	}

	await adapter.collection.deleteById({ slug: config.slug, id });

	//////////////////////////////////////////////
	// Hooks AfterDelete
	//////////////////////////////////////////////
	if (config.hooks && config.hooks.afterDelete) {
		for (const hook of config.hooks.afterDelete) {
			try {
				const args = await hook({ operation: 'delete', config, doc, event, rizom, api });
				doc = args.doc;
				event = args.event;
			} catch (err: any) {
				throw new RizomHookError(err.message);
			}
		}
	}

	return id;
};
