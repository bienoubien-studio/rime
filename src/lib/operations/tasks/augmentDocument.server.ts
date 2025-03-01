import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection, GenericDoc } from 'rizom/types';

export const augmentDocument = <T extends GenericDoc>(args: {
	document: Partial<T>;
	config: CompiledCollection | CompiledArea;
	locale?: string;
	event: RequestEvent;
}): T => {
	const { locale, config, event } = args;
	let output = args.document;

	// Add locale
	if (locale) {
		output.locale = locale;
	}

	// type and prototype
	output._prototype = config.type;
	output._type = config.slug;

	// populate title
	if (!('title' in output)) {
		output = {
			title: output[config.asTitle],
			...output
		};
	}

	// populate urls
	if (config.url) {
		output.url = config.url(output as any);
	}
	if (config.live && event.locals.user && config.url) {
		output._live = `${process.env.PUBLIC_RIZOM_URL}/live?src=${output.url}&slug=${config.slug}&id=${output.id}`;
		output._live += locale ? `&locale=${locale}` : '';
	}

	return output as T;
};
