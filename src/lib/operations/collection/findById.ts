import type { RequestEvent } from '@sveltejs/kit';
import { RizomAccessError } from '../../errors/access.server.js';
// import { RizomNotFoundError } from '../../errors/notFound.server.js';
import rizom from '$lib/rizom.server.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { BuiltCollectionConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomHookError } from 'rizom/errors/hook.server.js';

type Args = {
	id: string;
	locale?: string | undefined;
	config: BuiltCollectionConfig;
	api: LocalAPI;
	event?: RequestEvent;
	adapter: Adapter;
	depth?: number;
};

export const findById = async <T extends GenericDoc = GenericDoc>({
	id,
	locale,
	config,
	event,
	api,
	adapter,
	depth
}: Args) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	if (event) {
		const authorized = api.hasGrantedPrivilege || config.access.read(event.locals.user, { id });
		if (!authorized) {
			throw new RizomAccessError('- trying to read ' + config.slug);
		}
	}

	const rawDoc = (await adapter.collection.findById({
		slug: config.slug,
		id,
		locale
	})) as T;

	if (!rawDoc) {
		return null;
	}

	let doc = await adapter.transform.doc<T>({
		doc: rawDoc,
		slug: config.slug,
		event,
		api,
		locale,
		depth
	});

	//////////////////////////////////////////////
	// Hooks BeforeRead
	//////////////////////////////////////////////
	if (config.hooks && config.hooks.beforeRead) {
		for (const hook of config.hooks.beforeRead) {
			try {
				const args = await hook({ operation: 'read', config, doc, event, rizom, api });
				doc = args.doc as T;
				event = args.event;
			} catch (err: any) {
				throw new RizomHookError(err.message);
			}
		}
	}

	return doc as T;
};
