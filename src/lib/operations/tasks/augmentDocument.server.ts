import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from '$lib/types/config.js';
import type { GenericDoc } from '$lib/types/doc.js';
import type { Dic } from '$lib/types/util';
import { logger } from '$lib/util/logger/index.server';
import { getValueAtPath, isObjectLiteral } from '$lib/util/object.js';

/**
 * Augment document with locale, _type, _prototype
 * add the title prop as defined in config or with default : id or filename for a collection
 * add the _live url if relevant, based on the config.
 */
export const augmentDocument = async <T extends GenericDoc>(args: {
	document: Partial<T>;
	config: CompiledCollection | CompiledArea;
	locale?: string;
	event: RequestEvent;
}): Promise<T> => {
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
			title: getValueAtPath(config.asTitle, output),
			...output
		};
	}

	if (config.url) {
    
    let url = config.url(output as any)
    const match = url.match(/\[\.\.\.parent\.(\w+(?:\.\w+)*)\]/);
		
    if (match) {
			
      const fullMatch = match[0];
      const attributePath = match[1];

      // Create array to store parent attributes
      let attributesArray: string[] = [];
      let parent = Array.isArray(output.parent) && output.parent.length ? output.parent[0] : null
      const MAX_DEPTH = 6
      let depth = 0

      while (parent && depth < MAX_DEPTH) {
      		depth++
      		let parentId
      		if ('documentId' in parent) {
      			parentId = parent.documentId
      		} else {
      			parentId = parent.id
      		}

      		const docs = await event.locals.api.collection(config.slug as any).find({
      			query: `where[id][equals]=${parentId}`,
      			locale
      		});

      		// Check if there is a result
      		if (docs && docs.length > 0) {
      			const parentDoc = docs[0];
      			const parentAttribute = getValueAtPath(attributePath, parentDoc);

      			if (parentAttribute && typeof parentAttribute === 'string') {
      				attributesArray.push(parentAttribute);
      			} else if (parentAttribute) {
      				logger.warn('Bad URL property: not a string', { attributePath, parentAttribute });
      			}

      			// Move up to the next parent
      			parent = parentDoc.parent && Array.isArray(parentDoc.parent) && parentDoc.parent.length > 0 
      				? parentDoc.parent[0] 
      				: null;
      		} else {
      			parent = null;
      		}
      	}

			if(attributesArray.length){
				// Replace the parent reference with the joined attributes
				url = url.replace(fullMatch, attributesArray.reverse().join('/'))
			}else{
				url = url.replace( '/' + fullMatch, '')
			}
			
    } else {
      // replace "/[...parent.whatever.something.foo]" with ""
      url = url.replace(/\/\[\.\.\.parent\.\w+(?:\.\w+)*\]/, '')
    }
		output.url = url
	}

	if (config.live && event.locals.user && config.url) {
		output._live = `${process.env.PUBLIC_RIZOM_URL}/live?src=${output.url}&slug=${config.slug}&id=${output.id}`;
		output._live += locale ? `&locale=${locale}` : '';
	}

	output = sortDocumentKeys(output);

	return output as T;
};

function sortDocumentKeys<T extends Dic>(obj: T): T {
	const specificOrder = ['id', 'title', 'status'];
	const endOrder = [
		'locale',
		'path',
		'position',
		'ownerId',
		'createdAt',
		'updatedAt',
		'_type',
		'_prototype',
		'_live'
	];

	function sortObjectKeys(obj: Dic): Dic {
		// If not an object or is null, return the value as-is
		if (!obj || typeof obj !== 'object') return obj;

		// If array, process each object in the array
		if (Array.isArray(obj)) {
			return obj.map((item) => (typeof item === 'object' ? sortObjectKeys(item) : item));
		}

		// Sort the keys
		const keys = Object.keys(obj).sort((a, b) => {
			const aIndexSpecific = specificOrder.indexOf(a);
			const bIndexSpecific = specificOrder.indexOf(b);
			const aIndexEnd = endOrder.indexOf(a);
			const bIndexEnd = endOrder.indexOf(b);

			if (aIndexSpecific !== -1 && bIndexSpecific !== -1) {
				return aIndexSpecific - bIndexSpecific;
			}
			if (aIndexEnd !== -1 && bIndexEnd !== -1) {
				return aIndexEnd - bIndexEnd;
			}
			if (aIndexSpecific !== -1) return -1;
			if (bIndexSpecific !== -1) return 1;
			if (aIndexEnd !== -1) return 1;
			if (bIndexEnd !== -1) return -1;
			return a.localeCompare(b);
		});

		// Create new object with sorted keys
		const sorted: Dic = {};
		keys.forEach((key) => {
			const shouldOrder = Array.isArray(obj[key]) || isObjectLiteral(obj[key]);
			sorted[key] = shouldOrder ? sortObjectKeys(obj[key]) : obj[key];
		});

		return sorted;
	}

	return sortObjectKeys(obj) as T;
}
