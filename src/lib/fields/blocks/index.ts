import type { AnyField, FormField } from 'rizom/types/index.js';
import type { Dic } from 'rizom/types/utility.js';
import { FormFieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import Blocks from './component/Blocks.svelte';
import type { ComponentType } from 'svelte';
import type { FieldBluePrint } from 'rizom/types/fields';
import { compileField } from '../compile.js';
import { text } from '../text/index.js';
import { number } from '../number/index.js';

export const blueprint: FieldBluePrint<BlocksField> = {
	component: Blocks,
	match: (field): field is BlocksField => field.type === 'blocks'
};

export const blocks = (name: string) => new BlocksBuilder(name);
export const block = (name: string) => new BlockBuilder(name);

class BlocksBuilder extends FormFieldBuilder<BlocksField> {
	constructor(name: string) {
		super(name, 'blocks');
		this.field.blocks = [];
		this.field.isEmpty = (value) => Array.isArray(value) && value.length === 0;
	}

	blocks(...blocks: BlocksFieldBlock[]) {
		this.field.blocks = blocks;
		return this;
	}
}

class BlockBuilder {
	#block: BlocksFieldBlock;

	constructor(name: string) {
		this.#block = {
			name,
			fields: [
				text('type').hidden().toField(),
				text('path').hidden().toField(),
				number('position').hidden().toField()
			]
		};
	}
	/**
	 * Sets the icon, must be a lucide-svelte component
	 * @example
	 * import { Home } from 'lucide-svelte'
	 * block('home').icon(Home)
	 */
	icon(component: ComponentType) {
		this.#block.icon = component;
		return this;
	}
	renderTitle(render: BlocksFieldBlockRenderTitle) {
		this.#block.renderTitle = render;
		return this;
	}
	description(description: string) {
		this.#block.description = description;
		return this;
	}
	label(label: string) {
		this.#block.label = label;
		return this;
	}
	fields(...fields: UserDefinedField[]) {
		this.#block.fields.push(...fields.map(compileField));
		return { ...this.#block };
	}
}

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////
export type BlocksField = FormField & {
	type: 'blocks';
	blocks: BlocksFieldBlock[];
};

export type BlocksFieldBlockRenderTitle = (args: { fields: Dic; position: number }) => string;

export type BlocksFieldBlock = {
	name: string;
	label?: string;
	description?: string;
	icon?: ComponentType;
	renderTitle?: BlocksFieldBlockRenderTitle;
	fields: AnyField[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		blocks: any;
	}
	interface RegisterFormFields {
		BlocksField: BlocksField; // register the field type
	}
}
