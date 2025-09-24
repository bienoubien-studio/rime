import { FormFieldBuilder } from '$lib/core/fields/builders/form-field-builder.js';
import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import Cell from './component/Cell.svelte';
import RichText from './component/RichText.svelte';

import type {
	MediaFeatureDefinition,
	PredefinedFeatureName,
	ResourceFeatureDefinition,
	RichTextFeature
} from './core/types.js';

import type { JSONContent } from '@tiptap/core';

const isEmpty = (value: unknown) => {
	const reduceText = (prev: string, curr: any) => {
		if ('text' in curr) {
			prev += curr.text;
		} else if ('content' in curr) {
			return curr.content.reduce(reduceText, prev);
		}
		return prev;
	};
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype &&
		'content' in value &&
		Array.isArray(value.content) &&
		value.content.reduce(reduceText, '') === ''
	);
};

export class RichTextFieldBuilder extends FormFieldBuilder<RichTextField> {
	//
	_metaUrl = import.meta.url;

	constructor(name: string) {
		super(name, 'richText');
		this.field.isEmpty = isEmpty;
		this.field.hooks = {
			beforeRead: [RichTextFieldBuilder.jsonParse],
			beforeSave: [RichTextFieldBuilder.stringify],
			beforeValidate: []
		};
	}

	get component() {
		return RichText;
	}

	get cell() {
		return Cell;
	}

	/**
	 * Sets a custom TipTap editor configuration for the rich text field.
	 *
	 * @param param - a feature name, a RichTextFeature object, or a shortcut config string
	 *
	 * @example
	 * // Using predefined features
	 * richText('intro').features('bold', 'heading', 'link')
	 *
	 * // Using custom features
	 * richText('intro').features(myCustomFeature)
	 *
	 */
	features(
		...features: Array<ResourceFeatureDefinition | MediaFeatureDefinition | PredefinedFeatureName | RichTextFeature>
	) {
		this.field.features = features;
		return this;
	}

	static readonly jsonParse = (value: string) => {
		try {
			value = JSON.parse(value);
		} catch {
			if (typeof value === 'string') {
				return value;
			}
			return '';
		}
		return value;
	};

	static readonly stringify = (value: string) => {
		if (typeof value === 'string') return value;
		try {
			value = JSON.stringify(value);
		} catch (err: any) {
			console.error(err.message);
		}
		return value;
	};

	defaultValue(value: RichTextContent | DefaultValueFn<RichTextContent>) {
		this.field.defaultValue = value;
		return this;
	}
}

export const richText = (name: string) => new RichTextFieldBuilder(name);

/**
 * Converts rich text JSON content to plain text.
 * Extracts text content from a TipTap/ProseMirror JSON structure.
 *
 * @example
 * // Returns "Hello world"
 * richTextJSONToText('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}');
 */
export const richTextJSONToText = (value: string | JSONContent): string => {
	if (!value) return '';
	let textValue: string;
	const renderNodes = (nodes: { [k: string]: any }) => {
		return nodes
			.map((node: { text?: string; [k: string]: any }) => {
				if ('text' in node) {
					return node.text;
				} else if ('content' in node) {
					return renderNodes(node.content);
				}
			})
			.join(' ');
	};

	try {
		const jsonContent = typeof value === 'string' ? JSON.parse(value) : value;
		textValue = renderNodes(jsonContent.content);
	} catch (err) {
		console.error(err);
		textValue = JSON.stringify(value);
	}
	return textValue;
};

type RichTextContent = { type: 'doc'; content: JSONContent[] };

export type RichTextField = FormField & {
	type: 'richText';
	features?: Array<MediaFeatureDefinition | ResourceFeatureDefinition | PredefinedFeatureName | RichTextFeature>;
	defaultValue?: RichTextContent | DefaultValueFn<RichTextContent>;
};
