import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Blocks from './component/Blocks.svelte';
import Cell from './component/Cell.svelte';
import { text } from '../text/index.server.js';
import { number } from '../number/index.js';
import { toPascalCase } from '$lib/util/string.js';
import type { Component } from 'svelte';
import type { FormField, Field } from '$lib/fields/types.js';
import type { Dic, WithoutBuilders } from '$lib/util/types.js';
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

	_toType() {
		const blockNames = this.field.blocks.map((block) => `Block${toPascalCase(block.raw.name)}`);
		return `${this.field.name}: Array<${blockNames.join(' | ')}>,`;
	}

	get component() {
		return Blocks;
	}
	get cell() {
		return Cell;
	}

	localized() {
		if (this.field.blocks.length === 0) {
			throw new Error('localized() must be called after blocks assignment');
		}
		this.field.localized = true;

		// Set all descendant fields localized
		this.field.blocks = this.field.blocks.map((blockBuilder) => {
			// Add a locale prop in each block
			const hasAlreadyLocale = !!blockBuilder.block.fields
				.filter((field) => field instanceof FormFieldBuilder)
				.find((field) => field.raw.name === 'locale');
			if (!hasAlreadyLocale) {
				blockBuilder.block.fields.push(text('locale').hidden());
			}
			// In each block process fields
			blockBuilder.block.fields = blockBuilder.block.fields.map((field) => {
				// If type / position / path field do not set as localized
				// as it's a block property
				if (field instanceof FormFieldBuilder && ['position', 'type', 'path', 'locale'].includes(field.raw.name)) {
					return field;
				}
				// For all others fields set as localized
				if ('localized' in field && field instanceof FormFieldBuilder) {
					// Clone to prevent localizing a field used elsewhere
					const fieldClone = field.clone();
					fieldClone.localized();
					return fieldClone;
				}
				return field;
			});

			return blockBuilder;
		});

		return this;
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
	block: BlocksFieldBlock;

	constructor(name: string) {
		this.block = {
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
		this.block.icon = component;
		return this;
	}
	image(url: string) {
		this.block.image = url;
		return this;
	}
	renderTitle(render: BlocksFieldBlockRenderTitle) {
		this.block.renderTitle = render;
		return this;
	}
	description(description: string) {
		this.block.description = description;
		return this;
	}
	label(label: string) {
		this.block.label = label;
		return this;
	}
	fields(...fields: FieldBuilder<Field>[]) {
		this.block.fields = [...fields, ...this.block.fields];
		return this;
	}

	get raw() {
		return { ...this.block };
	}

	compile(): WithoutBuilders<BlocksFieldBlock> {
		return { ...this.block, fields: this.block.fields.map((f) => f.compile()) };
	}
}

/****************************************************/
/* Types
/****************************************************/
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
	image?: string;
	icon?: Component<IconProps>;
	renderTitle?: BlocksFieldBlockRenderTitle;
	fields: FieldBuilder<Field>[];
};

export type BlocksFieldRaw = FormField & {
	type: 'blocks';
	tree?: boolean;
	blocks: WithoutBuilders<BlocksFieldBlock>[];
};
