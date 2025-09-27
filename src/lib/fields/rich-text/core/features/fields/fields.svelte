<script lang="ts">
	import { page } from '$app/state';
	import { FieldBuilder, FormFieldBuilder } from '$lib/core/fields/builders';
	import FieldsPreview from '$lib/panel/components/fields/FieldsPreview.svelte';
	import FieldsPreviewTrigger from '$lib/panel/components/fields/FieldsPreviewTrigger.svelte';
	import * as Sheet from '$lib/panel/components/ui/sheet/index.js';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { setLocaleContext } from '$lib/panel/context/locale.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import { onMount } from 'svelte';
	import NodeViewWrapper from '../../svelte/node-view-wrapper.svelte';
	import './fields.css';

	type Props = Omit<NodeViewProps, 'extension'> & {
		extension: {
			options: {
				fields: FieldBuilder[];
			};
		};
	};

	let { node, extension, updateAttributes }: Props = $props();
	let isSheetOpen = $state(false);

	const locale = setLocaleContext(page.data.locale || 'en');
	const form = setFormContext(node.attrs.json || {}, 'sheet');

	onMount(() => {
		if (!node.attrs.json) {
			isSheetOpen = true;
		}
	});

	$effect(() => {
		if (form.values) {
			updateAttributes({
				json: form.values
			});
		}
	});

	const previewFields = $derived.by(() => {
		return extension.options.fields.filter((field) => field instanceof FormFieldBuilder);
	});
</script>

<NodeViewWrapper>
	<FieldsPreviewTrigger class="rz-rich-text-fields-preview" onclick={() => (isSheetOpen = true)}>
		<FieldsPreview fields={previewFields} getField={(field) => form.useField(field.name, field.raw)} />
	</FieldsPreviewTrigger>
</NodeViewWrapper>

<Sheet.Root bind:open={isSheetOpen}>
	<Sheet.Content side="right" class="rz-rich-text-sheet">
		{#each previewFields || [] as field, index (index)}
			{@const FieldComponent = field.component}
			<FieldComponent config={field.raw} {form} />
		{/each}
	</Sheet.Content>
</Sheet.Root>

<style lang="postcss">
	:global(.ProseMirror-focused .ProseMirror-selectednode .rz-fields-preview__trigger) {
		@mixin ring var(--rz-color-spot);
	}

	:global(.rz-rich-text-sheet) {
		gap: var(--rz-size-6);
		display: flex;
		flex-direction: column;
	}

	:global(.rz-rich-text-fields-preview) :global {
		font-size: var(--rz-text-sm);
		max-width: 420px;
		border-radius: var(--rz-radius-lg);

		.rz-render-fields-preview__row:first-child .rz-render-fields-preview__name {
			border-top-left-radius: var(--rz-radius-lg);
		}
		.rz-render-fields-preview__row:last-child .rz-render-fields-preview__name {
			border-bottom-left-radius: var(--rz-radius-lg);
		}
	}
</style>
