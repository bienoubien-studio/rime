import type { CompiledCollection } from '$lib/core/config/types/index.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import { getValueAtPath, isObjectLiteral, setValueAtPath } from '$lib/util/object.js';
import type { Dic } from '$lib/util/types';
import type { RequestEvent } from '@sveltejs/kit';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	isSystemOperation?: boolean;
};

// If block is localized should not keep its id so it created a new one
// If block is not localized than it should keep its id so block is updated

export const duplicate = async (args: DeleteArgs): Promise<string> => {
	const { config, event, id } = args;
	const { rizom } = event.locals;

	/**
	 * Set a copy title, ex: Current Title (copy)
	 * on the given document
	 */
	function setCopyTitle(doc: Dic) {
		const title = getValueAtPath<string>(config.asTitle, doc);
		const data = setValueAtPath<Dic>(config.asTitle, doc, title + ' (copy)');
		return data;
	}

	/**
	 * Prepare duplcation :
	 * - set the copy title
	 * - set status to draft if needed
	 * - normalize properties
	 */
	function prepareDuplicate(doc: Dic, locale: string | undefined) {
		let data = setCopyTitle(doc);
		data.satus = data.satus ? VERSIONS_STATUS.DRAFT : undefined;
		data = normalizeProps(data, locale);
		return data;
	}

	// Store currrent locale
	const currentLocale = event.locals.locale;
	// Get the collection api
	const collection = rizom.collection(config.slug);
	// Get the defaultLocale to copy first from the default one
	const defaultLocale = rizom.config.getDefaultLocale();
	// Set locale to the default one
	if (defaultLocale) rizom.setLocale(defaultLocale);

	// Fetch document to copy
	const document = await collection.findById({ id, locale: defaultLocale });
	// Prepare data
	const data = prepareDuplicate(document, defaultLocale);
	// Create document
	const newDocument = await collection.create({ data, locale: defaultLocale });

	// Now update created document with other locale data
	// Get all locales
	const allLocales = rizom.config.getLocalesCodes();
	const otherLocales = allLocales.filter((l) => l !== defaultLocale);

	for (const locale of otherLocales) {
		// set the event locale for next operations
		rizom.setLocale(locale);
		// Get localized document
		const docLocalized = await collection.findById({ id, locale, draft: true });
		// Prepare data
		const data = prepareDuplicate(docLocalized, locale);
		// Update document for this locale
		await collection.updateById({ id: newDocument.id, data, locale });
	}
	// Reset event locale
	rizom.setLocale(currentLocale);

	return newDocument.id;
};

const normalizeProps = (obj: any, locale: string | undefined): any => {
	if (Array.isArray(obj)) {
		return obj.map((item) => normalizeProps(item, locale));
	}

	if (isObjectLiteral(obj)) {
		if (obj.locale) obj.locale = locale;
		return Object.entries(obj)
			.filter(([key]) => key !== 'id' && key !== 'ownerId' && key !== 'createdAt' && key !== 'updatedAt')
			.reduce(
				(acc, [key, value]) => ({
					...acc,
					[key]: normalizeProps(value, locale)
				}),
				{}
			);
	}

	return obj;
};
