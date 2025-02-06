import type { AnyField, FormField } from 'rizom/types/index.js';
import type { Dic } from 'rizom/types/utility.js';
import { FieldBuilder, FormFieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import Blocks from './component/Blocks.svelte';
import Cell from './component/Cell.svelte';
import type { ComponentType } from 'svelte';
import { text } from '../text/index.js';
import { number } from '../number/index.js';

export const blocks = (name: string) => new BlocksBuilder(name);

export const block = (name: string) => new BlockBuilder(name);

export class BlocksBuilder extends FormFieldBuilder<BlocksField> {
	constructor(name: string) {
		super(name, 'blocks');
		this.field.blocks = [];
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
	}

	get component() {
		return Blocks;
	}
	get cell() {
		return Cell;
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
			fields: [text('type').hidden(), text('path').hidden(), number('position').hidden()]
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
		this.#block.fields = [...fields, ...this.#block.fields];
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
	fields: FieldBuilder<AnyField>[];
};

export type RawBlocksField = FormField & {
	type: 'blocks';
	blocks: {
		name: string;
		label?: string;
		description?: string;
		icon?: ComponentType;
		renderTitle?: BlocksFieldBlockRenderTitle;
		fields: AnyField[];
	}[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		blocks: any;
	}
	interface RegisterFormFields {
		BlocksField: BlocksField | RawBlocksField;
	}
}
