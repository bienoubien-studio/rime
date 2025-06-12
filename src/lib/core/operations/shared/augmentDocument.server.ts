import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { Dic } from '$lib/util/types';
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
