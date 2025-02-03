import type { RequestEvent } from '@sveltejs/kit';
import rizom from '$lib/rizom.server.js';
import type { LocalAPI } from 'rizom/types/api.js';
import type { BuiltCollectionConfig, CompiledCollectionConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import { RizomError } from 'rizom/errors/index.js';

type Args = {
	id: string;
	locale?: string | undefined;
	config: CompiledCollectionConfig;
	api: LocalAPI;
	event: RequestEvent;
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

	const authorized = config.access.read(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
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
				throw new RizomError(RizomError.HOOK, err.message);
			}
		}
	}

	return doc as T;
};
