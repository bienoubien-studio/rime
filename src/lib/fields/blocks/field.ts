import type { BlocksField, BlocksFieldBlock, BlocksFieldBlockRenderTitle } from './index.js';
import { FormFieldBuilder } from '../field-builder';
import type { UserDefinedField } from 'rizom/types';
import Blocks from './component/Blocks.svelte';
import type { ComponentType } from 'svelte';
import type { FieldBluePrint } from '../index.js';
import { compileField } from '../compile.js';

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
				{ name: 'type', type: 'text', hidden: true },
				{ name: 'path', type: 'text', hidden: true },
				{ name: 'position', type: 'number', hidden: true }
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
