import type { RequestEvent } from '@sveltejs/kit';
import { RizomAccessError } from '../../errors/access.server.js';
import rizom from '$lib/rizom.server.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { OperationQuery } from 'rizom/types/api.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomHookError } from 'rizom/errors/hook.server.js';

type FindArgs = {
	query: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const find = async <T extends GenericDoc = GenericDoc>({
	query,
	locale,
	config,
	event,
	api,
	adapter,
	sort,
	depth,
	limit
}: FindArgs): Promise<T[]> => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////

	const authorized = config.access.read(event.locals.user);
	if (!authorized) {
		throw new RizomAccessError('- trying to read ' + config.slug);
	}

	const rawDocs = (await adapter.collection.query({
		slug: config.slug,
		query,
		sort,
		limit,
		locale
	})) as T[];

	const docs = await adapter.transform.docs<T>({
		docs: rawDocs,
		slug: config.slug,
		api,
		locale,
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
					const args = await hook({ operation: 'read', config, doc, event, rizom, api });
					event = args.event;
					docs[index] = doc;
				} catch (err: any) {
					throw new RizomHookError(err.message);
				}
			}
		}
	}

	return docs as T[];
};
