import type { RequestEvent } from '@sveltejs/kit';
import { RizomAccessError } from '../../errors/access.js';
import rizom from '$lib/rizom.server.js';
import type { LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';
import type { GenericDoc } from 'rizom/types/doc';
import type { BuiltGlobalConfig } from 'rizom/types/config';

type FindArgs = {
	locale?: string | undefined;
	config: BuiltGlobalConfig;
	event?: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
};

export const find = async <T extends GenericDoc = GenericDoc>({
	locale,
	config,
	event,
	api,
	adapter
}: FindArgs): Promise<T> => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	if (event) {
		const authorized = api.hasGrantedPrivilege || config.access.read(event.locals.user);
		if (!authorized) {
			throw new RizomAccessError('- trying to read ' + config.slug);
		}
	}

	const rawDoc = (await adapter.global.get({ slug: config.slug, locale })) as T;

	let doc = await adapter.transform.doc<T>({ doc: rawDoc, slug: config.slug, locale, event, api });

	//////////////////////////////////////////////
	// Hooks BeforeRead
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeRead) {
		for (const hook of config.hooks.beforeRead) {
			const args = await hook({ operation: 'read', config, doc, event, rizom, api });
			event = args.event;
			doc = args.doc as T;
		}
	}

	return doc;
};
