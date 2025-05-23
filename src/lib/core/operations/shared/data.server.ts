import { RizomFormError } from '$lib/core/errors/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { flatten, unflatten } from 'flat';
import type { Dic } from '$lib/util/types';

export const extractData = async (request: RequestEvent['request']) => {
	let data;
	try {
		const contentType = request.headers.get('content-type');
		const isMultiPartFormData = contentType?.startsWith('multipart/form-data');
		const isFormURLEncoded = contentType?.startsWith('application/x-www-form-urlencoded');
		if (isMultiPartFormData || isFormURLEncoded) {
			/** Handle formData input */
			const formData = await request.formData();
			data = formDataToData(formData);
		} else {
			/** Handle JSON input */
			const jsonData = await request.json();
			data = jsonDataToData(jsonData);
		}
	} catch {
		throw new RizomFormError({ _form: RizomFormError.CONTENT_LENGTH_LIMIT });
	}

	return data as Partial<GenericDoc>;
};

export const formDataToData = (formData: FormData) => {
	const flatData = Object.fromEntries(formData.entries());
	for (const key of Object.keys(flatData)) {
		flatData[key] = normalizeValue(flatData[key]);
	}
	return unflatten(flatData) as GenericDoc;
};

export const jsonDataToData = (jsonData: Dic) => {
	const flatData: Dic = flatten(jsonData);
	for (const key of Object.keys(flatData)) {
		flatData[key] = normalizeValue(flatData[key]);
	}
	return unflatten(flatData) as GenericDoc;
};

const normalizeValue = (value: any) => {
	if (value === 'false' || value === 'true') {
		return value === 'true';
	}
	if (value === 'null') {
		return null;
	}
	if (value === 'undefined') {
		return undefined;
	}
	// For time values return raw value
	if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
		return value;
	}
	// For integers parseInt
	if (/^[\d]+$/.test(value)) {
		return parseInt(value);
	}
	// For floats parseFloat
	if (/^[\d]+\.[\d]+$/.test(value)) {
		return parseFloat(value);
	}
	return value;
};
