import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc, User } from 'rizom/types';
import type { CompiledCollectionConfig, CompiledGlobalConfig } from 'rizom/types/config';
import type { Dic } from 'rizom/types/utility';
import { omit } from 'rizom/utils/object';
import { buildConfigMap } from '../preprocess/config/map';
import { privateFieldNames } from 'rizom/collection/auth/privateFields.server';
import { safeFlattenDoc } from 'rizom/utils/doc';
import { postprocessFields } from './fields.server';
import { unflatten } from 'flat';
import { isUploadConfig } from 'rizom/config/utils';

type BeforReadDocumentArgs = {
	doc: Dic;
	user?: User;
	event: RequestEvent;
	isPanel: boolean;
	config: CompiledCollectionConfig | CompiledGlobalConfig;
	locale?: string;
};

export const beforeRead = async ({
	doc,
	user,
	event,
	isPanel,
	config,
	locale
}: BeforReadDocumentArgs) => {
	// @TODO set all private fields with a double underscore ?
	const keysToDelete = [...privateFieldNames];
	if (!isPanel || !user) {
		keysToDelete.push('authUserId', '_editedBy');
	}
	let output = omit(keysToDelete, doc);

	/////////////////////////////////////////////
	// Fields access and beforeRead hooks
	//////////////////////////////////////////////
	const configMap = buildConfigMap(output, config.fields);
	const flatDoc = await postprocessFields({
		flatDoc: safeFlattenDoc(output),
		configMap,
		locale,
		api: event.locals.api,
		user
	});

	/////////////////////////////////////////////
	// Populate image sizes
	//////////////////////////////////////////////
	if (config.type === 'collection' && isUploadConfig(config)) {
		if ('imageSizes' in config && config.imageSizes) {
			flatDoc.sizes = {};
			for (const size of config.imageSizes) {
				if (flatDoc[size.name]) {
					// Handle multiple formats
					const formats = flatDoc[size.name].split('|') as string[];

					if (formats.length > 1) {
						// Multiple formats case: use object
						flatDoc.sizes[size.name] = {};
						formats.forEach((format) => {
							const extension = format.split('.').pop()!;
							flatDoc.sizes[size.name][extension] = `/medias/${format}`;
						});
					} else {
						// Single format case: use string
						flatDoc.sizes[size.name] = `/medias/${formats[0]}`;
					}

					delete flatDoc[size.name];
				} else {
					// Default case: use original file as string
					flatDoc.sizes[size.name] = `/medias/${flatDoc.filename}`;
				}
			}
		}

		flatDoc.url = `/medias/${flatDoc.filename}`;
	}

	doc = unflatten(flatDoc);

	/////////////////////////////////////////////
	// Augment Doc
	//////////////////////////////////////////////

	// Add locale
	if (locale) {
		doc.locale = locale;
	}

	// type and prototype
	doc._prototype = config.type;
	doc._type = config.slug;

	// populate title
	if (!('title' in doc)) {
		doc = {
			title: doc[config.asTitle],
			...doc
		};
	}

	// populate urls
	if (config.url) {
		doc._url = config.url(doc as GenericDoc);
	}
	if (config.live && user && config.url) {
		doc._live = `${process.env.PUBLIC_RIZOM_URL}/live?src=${doc._url}&slug=${config.slug}&id=${doc.id}`;
		doc._live += locale ? `&locale=${locale}` : '';
	}

	return orderObjectKeys(doc);
};

function orderObjectKeys(obj: any): any {
	// Special keys that should come first (in this order)
	const priorityKeys = ['id', 'title'];

	// Get all keys and separate them
	const keys = Object.keys(obj);
	const underscoreKeys = keys.filter((k) => k.startsWith('_')).sort();
	const normalKeys = keys.filter((k) => !k.startsWith('_') && !priorityKeys.includes(k)).sort();

	// Combine keys in desired order
	const orderedKeys = [
		...priorityKeys.filter((k) => keys.includes(k)),
		...normalKeys,
		...underscoreKeys
	];

	// Create new object with ordered keys
	return orderedKeys.reduce((newObj: any, key: string) => {
		newObj[key] = obj[key];
		return newObj;
	}, {});
}
