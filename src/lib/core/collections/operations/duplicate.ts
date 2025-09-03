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

	const collection = rizom.collection(config.slug);
	const defaultLocale = rizom.config.getDefaultLocale();

	const document = await collection.findById({ id, locale: defaultLocale });

	const title = getValueAtPath(config.asTitle, document);
	let data = setValueAtPath<Dic>(config.asTitle, document, title + ' (copy)');
	data.satus = data.satus ? VERSIONS_STATUS.DRAFT : undefined;
	data = prepareDuplicate(data);

	if (defaultLocale) rizom.setLocale(defaultLocale);
	const newDocument = await collection.create({ data, locale: defaultLocale });

	const allLocales = rizom.config.getLocalesCodes();
	const otherLocales = allLocales.filter((l) => l !== defaultLocale);

	console.log('#################################');
	console.log('#################################');
	console.log('#################################');
	console.log('#################################');

	for (const locale of otherLocales) {
		console.log('======== ' + locale);
		rizom.setLocale(locale);
		const docLocalized = await collection.findById({ id, locale });
		const title = getValueAtPath(config.asTitle, docLocalized);
		let data = setValueAtPath<Dic>(config.asTitle, docLocalized, title + ' (copy)');
		data = prepareDuplicate(data);

		console.log(data.layout.sections);

		await collection.updateById({ id: newDocument.id, data, locale });
	}

	return newDocument.id;
};

const prepareDuplicate = (obj: any): any => {
	if (Array.isArray(obj)) {
		return obj.map((item) => prepareDuplicate(item));
	}

	if (isObjectLiteral(obj)) {
		return Object.entries(obj)
			.filter(
				([key]) => key !== 'id' && key !== 'ownerId' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'locale'
			)
			.reduce(
				(acc, [key, value]) => ({
					...acc,
					[key]: prepareDuplicate(value)
				}),
				{}
			);
	}

	return obj;
};
