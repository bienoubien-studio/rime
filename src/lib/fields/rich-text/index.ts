import type { FormField } from '$lib/types/fields.js';
import { FormFieldBuilder } from '../builders/index.js';
import RichText from './component/RichText.svelte';
import Cell from './component/Cell.svelte';
import type { MediaFeatureDefinition, ResourceFeatureDefinition, PredefinedFeatureName, RichTextFeature } from './core/types.js';

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

class RichTextFieldBuilder extends FormFieldBuilder<RichTextField> {
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

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = this.field.required ? '.notNull()' : '';
		return `${camel}: text('${snake}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: import('@tiptap/core').JSONContent`;
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
	 * // Using shortcut config string (legacy)
	 * richText('intro').features('[h1|h2] bold|italic|link')
	 */
	features(...features: Array<ResourceFeatureDefinition | MediaFeatureDefinition | PredefinedFeatureName | RichTextFeature>) {
		this.field.features = features
		return this;
	}
	
	static readonly jsonParse = (value: string) => {
		try {
			value = JSON.parse(value);
		} catch (err: any) {
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

	defaultValue(value: { type: 'doc'; content: any[] }) {
		this.field.defaultValue = value;
		return this;
	}
}

export const richText = (name: string) => new RichTextFieldBuilder(name);

export type RichTextField = FormField & {
	type: 'richText';
	features?: Array<MediaFeatureDefinition | ResourceFeatureDefinition | PredefinedFeatureName | RichTextFeature>;
	defaultValue?: { type: 'doc'; content: any[] };
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////

declare module 'rizom' {
	interface RegisterFieldsType {
		richText: any;
	}
	interface RegisterFormFields {
		RichTextField: RichTextField;
	}
}
