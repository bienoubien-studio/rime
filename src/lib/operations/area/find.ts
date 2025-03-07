import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, GenericDoc, Adapter } from 'rizom/types';
import { RizomError } from 'rizom/errors';
import { transformDocument } from '../tasks/transformDocument.server';
import type { LocalAPI } from '../localAPI/index.server';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const { config, event, adapter, locale, api, depth } = args;

	const authorized = config.access.read(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentRaw = await adapter.area.get({
		slug: config.slug,
		locale
	});

	let document = await transformDocument<T>({
		raw: documentRaw,
		config,
		api,
		adapter,
		locale,
		depth,
		event
	});

	for (const hook of config.hooks?.beforeRead || []) {
		const result = await hook({
			doc: document,
			config,
			operation: 'read',
			api,
			rizom: event.locals.rizom,
			event
		});
		document = result.doc as T;
	}

	return document;
};
