<script lang="ts">
	import { moveItem } from '$lib/util/array';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import { useSortable } from '$lib/panel/util/Sortable.js';
	import Tag from '$lib/panel/components/ui/tag/tag.svelte';
	import type { SelectFieldProps } from './props.js';
	import { t__ } from '$lib/core/i18n/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';

	const { path, config, form }: SelectFieldProps = $props();

	let listHTMLElement: HTMLElement;
	const validValues = config.options.map((o) => o.value);
	let initialized = false;

	const field = $derived(form.useField(path, config));

	let options = $state(config.options);
	let isFull = $derived.by(() => {
		if (!field.value) return false;
		const notManyAndOneSelected = !config.many && typeof field.value === 'string';
		const manyAndAllSelected = config.many && field.value.length === config.options.length;
		return notManyAndOneSelected || manyAndAllSelected;
	});

	let search = $state('');
	let inputFocused = $state(false);

	const { sortable } = useSortable({
		animation: 150,
		draggable: '.rz-select__option',
		onEnd: function (e) {
			if (e.oldIndex !== undefined && e.newIndex !== undefined) {
				onOrderChange(e.oldIndex, e.newIndex);
			}
		}
	});

	$effect(() => {
		if (config.many) {
			sortable(listHTMLElement);
		}
	});

	$effect(() => {
		if (config.many) {
			if (field.value && Array.isArray(field.value) && !initialized) {
				field.value = field.value.filter((val: string) => validValues.includes(val));
			}
		} else {
			if (field.value && !initialized) {
				field.value = validValues.includes(field.value) ? field.value : null;
			}
		}
		initialized = true;
	});

	$effect(() => {
		if (config.many) {
			if (!field.value) {
				options = config.options;
			} else {
				options = config.options.filter((option) => !field.value.includes(option.value));
			}
		}
	});

	const onOrderChange = (oldIndex: number, newIndex: number) => {
		field.value = moveItem(field.value, oldIndex, newIndex);
	};

	const addValue = (val: string) => {
		if (isFull) return;
		if (config.many) {
			field.value = [...(field.value || []), val];
		} else {
			field.value = val;
		}
	};

	const removeValue = (val?: string) => {
		if (config.many) {
			field.value = [...(field.value || [])].filter((v) => v !== val);
		} else {
			field.value = null;
		}
	};
</script>

<fieldset class="rz-field-select {config.className || ''}" use:root={field}>
	<Field.Label for={path} {config} />
	<Field.Error error={field.error} />

	<div class="rz-select">
		<Command.Root>
			<div
				bind:this={listHTMLElement}
				class="rz-select__list"
				class:rz-select__list--readonly={form.readOnly}
				data-focused={inputFocused ? '' : null}
				data-error={field.error ? '' : null}
			>
				{#if config.many}
					{#each field.value as val (val)}
						{@const option = config.options.filter((o) => o.value === val)[0]}
						<Tag onRemove={() => removeValue(option.value)} readOnly={form.readOnly}>
							{option.label}
						</Tag>
					{/each}
				{:else if field.value}
					{@const option = config.options.filter((o) => o.value === field.value)[0]}
					{#if option}
						<Tag onRemove={() => removeValue()} readOnly={form.readOnly}>
							{option.label}
						</Tag>
					{/if}
				{/if}

				{#if !form.readOnly && !isFull}
					<Command.InputSelect
						onfocus={() => (inputFocused = true)}
						onblur={() => setTimeout(() => (inputFocused = false), 200)}
						bind:value={search}
						placeholder={t__('common.search')}
					/>
					{#if inputFocused}
						<Command.List>
							{#each options as option, index (index)}
								<Command.Item
									value={option.value}
									onSelect={() => {
										addValue(option.value);
										search = '';
									}}
								>
									<span>{option.label}</span>
								</Command.Item>
							{/each}
						</Command.List>
					{/if}
				{/if}
			</div>
		</Command.Root>
	</div>
</fieldset>

<style type="postcss">
	.rz-select {
		margin-bottom: var(--rz-size-3);
		position: relative;

		:global(.rz-command) {
			width: 100%;
			border-radius: var(--rz-radius-md);
		}

		:global(.rz-command-input-select) {
			cursor: text;
		}

		:global(.rz-command-list) {
			background-color: hsl(var(--rz-color-input));
			border: var(--rz-border);
			border-radius: var(--rz-radius-md);
			position: absolute;
			left: 0;
			right: 0;
			top: var(--rz-size-12);
			z-index: 10;
			box-shadow: var(--rz-shadow-md);
		}

		:global(.rz-command-item) {
			height: var(--rz-size-10);
		}
	}

	.rz-select__list {
		background-color: hsl(var(--rz-color-input));
		border: var(--rz-border);
		border-radius: var(--rz-radius-md);
		display: flex;
		flex-wrap: wrap;
		gap: var(--rz-size-2);
		min-height: var(--rz-size-10);
		padding: var(--rz-size-2) var(--rz-size-3);
	}

	.rz-select__list[data-focused] {
		@mixin ring var(--rz-color-ring);
	}

	.rz-select__list[data-error] {
		@mixin ring var(--rz-color-error);
	}

	.rz-select__list--readonly {
		cursor: no-drop;
	}
</style>
