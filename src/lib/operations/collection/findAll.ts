import rizom from '$lib/rizom.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomError } from 'rizom/errors/index.js';

type Args = {
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const findAll = async <T extends GenericDoc = GenericDoc>({
	locale,
	config,
	adapter,
	api,
	depth,
	sort,
	limit,
	event
}: Args): Promise<T[]> => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////

	const authorized = config.access.read(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const rawDocs = (await adapter.collection.findAll({
		slug: config.slug,
		sort,
		limit,
		locale
	})) as T[];

	const docs = await adapter.transform.docs<T>({
		docs: rawDocs,
		slug: config.slug,
		locale,
		api,
		event,
		depth
	});

	//////////////////////////////////////////////
	// Hooks BeforeRead
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeRead) {
		for (const hook of config.hooks.beforeRead) {
			for (const [index, doc] of docs.entries()) {
				try {
					const hookArgs = await hook({ operation: 'read', config, doc, event, rizom, api });
					event = hookArgs.event;
					docs[index] = doc;
				} catch (err: any) {
					throw new RizomError(RizomError.HOOK, err.message);
				}
			}
		}
	}

	return docs as T[];
};
