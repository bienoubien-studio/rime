<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { Plus, ToyBrick } from 'lucide-svelte';
	import { capitalize } from '$lib/utils/string.js';
	import { emptyValuesFromFieldConfig } from '$lib/utils/field.js';
	import { isFormField } from '$lib/utils/field.js';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import type { GenericBlock } from 'rizom/types/doc';
	import type { BlocksFieldRaw, BlocksFieldBlock } from '../index.js';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import type { WithoutBuilders } from 'rizom/types/utility.js';

	type AddBlock = (options: Omit<GenericBlock, 'id' | 'path'>) => void;
	type Props = {
		size: 'default' | 'sm';
		class: string;
		config: BlocksFieldRaw;
		addBlock: AddBlock;
	};
	const { class: className, config, addBlock, size }: Props = $props();

	let open = $state(false);

	const add = (block: WithoutBuilders<BlocksFieldBlock>) => {
		open = false;
		const empty = {
			...emptyValuesFromFieldConfig(block.fields.filter(isFormField)),
			type: block.name
		};
		addBlock(empty);
	};
</script>

{#if config.blocks.length === 1}
	<Button
		class="rz-add-block-button {className}"
		onclick={() => add(config.blocks[0])}
		variant="outline"
		{size}
	>
		<Plus size={15} />
		<span>
			{t__('fields.add_block')}
			{config.blocks[0].label || config.blocks[0].name}
		</span>
	</Button>
{:else}
	<Button class="rz-add-block-button {className}" onclick={() => (open = true)} variant="outline">
		<Plus size={15} />
		<span>{t__('fields.add_block')}</span>
	</Button>

	<Command.Dialog bind:open>
		<Command.Input class="rz-add-block-button__search" placeholder={t__('common.search')} />

		<Command.List class="rz-add-block-button__list">
			<Command.Empty>No results found.</Command.Empty>
			<Command.Group heading="Component">
				{#each config.blocks as block}
					{@const BlockIcon = block.icon || ToyBrick}
					<Command.Item
						class="rz-add-block-button__item"
						value={block.name}
						onSelect={() => {
							add(block);
							open = false;
						}}
					>
						<div class="rz-add-block-button__icon-wrapper">
							<BlockIcon size={17} />
						</div>
						<div class="rz-add-block-button__info">
							<p class="rz-add-block-button__title">
								{block.label || capitalize(block.name)}
							</p>
							{#if block.description}
								<p class="rz-add-block-button__description">
									{block.description}
								</p>
							{/if}
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.List>
	</Command.Dialog>
{/if}

<style type="postcss">
	:global {
		.rz-add-block-button {
			gap: var(--rz-size-2);
		}

		.rz-add-block-button__search {
			border-radius: var(--rz-radius-xl);
		}

		.rz-add-block-button__list {
			padding: var(--rz-size-2);
		}

		.rz-add-block-button__item {
			display: flex;
			gap: var(--rz-size-3);
			border-radius: var(--rz-radius-md);
		}
		.rz-add-block-button__item[aria-selected='true'] {
			background-color: hsl(var(--rz-ground-5));
		}
	}

	.rz-add-block-button__icon-wrapper {
		@mixin bg foreground, 0.9;
		display: flex;
		width: var(--rz-size-12);
		height: var(--rz-size-12);
		align-items: center;
		justify-content: center;
		border-radius: var(--rz-radius-xl);
	}

	.rz-add-block-button__title {
		font-size: var(--rz-text-lg);
		@mixin font-medium;
	}

	.rz-add-block-button__description {
		@mixin color foreground, 0.7;
		font-size: var(--rz-text-sm);
	}
</style>
