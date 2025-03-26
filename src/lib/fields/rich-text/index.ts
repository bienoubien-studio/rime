import type { FormField } from 'rizom/types/fields.js';
import { FormFieldBuilder } from '../builders/index.js';
import RichText from './component/RichText.svelte';
import Cell from './component/Cell.svelte';
import type { RichTextEditorConfig } from './core/types.js';

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
	 * @param param - a shortcut config string or an async import of the function that return the tiptap configuration.
	 * 
	 * The async import is needed as the browser config is rebuilt, and as TipTap config includes
	 * core imports, we can't keep track of all the possible import of all posibble extensions to rebuild the config.
	 * 
	 * @example
	 * richText('intro').tiptap((await import('./rich-text-config.js')).basic)
	 * // This will work also :
	 * const basicConfig = (await import('./rich-text-config.js')).basic
	 * //...
	 * richText('intro').tiptap(basicConfig)
	 */
	tiptap(param: any | string){
		this.field.tiptap = param
		return this
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
	tiptap?: (args: { config: RichTextField, element: HTMLElement }) => RichTextEditorConfig;
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
		RichTextField: RichTextField; // register the field type
	}
}
