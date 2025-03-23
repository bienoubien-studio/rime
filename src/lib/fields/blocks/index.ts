import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Blocks from './component/Blocks.svelte';
import Cell from './component/Cell.svelte';
import { text } from '../text/index.js';
import { number } from '../number/index.js';
import { toPascalCase } from 'rizom/util/string.js';
import type { Component } from 'svelte';
import type { FormField } from 'rizom/types/index.js';
import type { Dic, WithoutBuilders } from 'rizom/types/util.js';
import type { Field } from 'rizom/types/fields.js';
import type { IconProps } from '@lucide/svelte';

export const blocks = (name: string, blocks: BlockBuilder[]) => new BlocksBuilder(name, blocks);

export const block = (name: string) => new BlockBuilder(name);

export class BlocksBuilder extends FormFieldBuilder<BlocksField> {
	constructor(name: string, blocks: BlockBuilder[]) {
		super(name, 'blocks');
		this.field.blocks = blocks;
		this.field.defaultValue = [];
		this.field.isEmpty = (value) => {
			return !value || (Array.isArray(value) && value.length === 0);
		};
	}

	toType() {
		const blockNames = this.field.blocks.map((block) => `Block${toPascalCase(block.raw.name)}`);
		return `${this.field.name}: Array<${blockNames.join(' | ')}>,`;
	}

	get component() {
		return Blocks;
	}
	get cell() {
		return Cell;
	}

	compile(): WithoutBuilders<BlocksField> {
		return {
			...this.field,
			blocks: this.field.blocks.map((block) => {
				return block.compile();
			})
		} as unknown as WithoutBuilders<BlocksField>;
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
	 * Sets the icon, must be a @lucide/svelte component
	 * @example
	 * import { Home } from '@lucide/svelte'
	 * block('home').icon(Home)
	 */
	icon(component: Component<IconProps>) {
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
	fields(...fields: FieldBuilder<Field>[]) {
		this.#block.fields = [...fields, ...this.#block.fields];
		return this;
	}

	get raw() {
		return { ...this.#block };
	}

	compile(): WithoutBuilders<BlocksFieldBlock> {
		return { ...this.#block, fields: this.#block.fields.map((f) => f.compile()) };
	}
}

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////
export type BlocksField = FormField & {
	type: 'blocks';
	tree?: boolean;
	blocks: BlockBuilder[];
};

export type BlocksFieldBlockRenderTitle = (args: { values: Dic; position: number }) => string;

export type BlocksFieldBlock = {
	name: string;
	label?: string;
	description?: string;
	icon?: Component<IconProps>;
	renderTitle?: BlocksFieldBlockRenderTitle;
	fields: FieldBuilder<Field>[];
};

export type BlocksFieldRaw = FormField & {
	type: 'blocks';
	tree?: boolean;
	blocks: WithoutBuilders<BlocksFieldBlock>[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		blocks: any;
	}
	interface RegisterFormFields {
		BlocksField: BlocksField | BlocksFieldRaw;
	}
}
