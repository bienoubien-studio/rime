<script lang="ts">
	import { FieldBuilder } from '$lib/core/fields/builders';
	import type { Field } from '$lib/fields/types.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { isFormField, isLiveField, isNotHidden, isTabsField } from '$lib/util/field.js';
	import { capitalize } from '$lib/util/string.js';

	type Props = {
		path?: string;
		fields: FieldBuilder<Field>[];
		form: DocumentFormContext;
	};

	const { form, fields, path: initialPath = '' }: Props = $props();

	const user = getUserContext();

	const previewFields = $derived(
		fields
			.map((field) => field.raw)
			.filter((field) => !isTabsField(field))
			.filter((field) => isFormField(field))
			.filter((field) => {
				// if (isPresentative(field)) return true;
				if (field.access && field.access.read) {
					return field.access.read(user.attributes, { id: form.doc.id });
				}
				return true;
			})
	);

	const path = $derived(initialPath === '' ? '' : `${initialPath}.`);

	//
</script>

<div class="rz-render-fields-preview">
	{#each previewFields as fieldConfig, index (index)}
		{#if !form.isLive || (form.isLive && isLiveField(fieldConfig))}
			{@const field = form.useField(path + fieldConfig.name)}
			{#if isNotHidden(fieldConfig) && field.visible}
				<div class="rz-render-fields-preview__row" data-visible={field.visible || null}>
					<div class="rz-render-fields-preview__name">
						<p>
							{fieldConfig.label || capitalize(fieldConfig.name)}
						</p>
					</div>
					<div class="rz-render-fields-preview__value">
						{#if fieldConfig.table?.cell}
							{@const ColumnTableCell = fieldConfig.table.cell}
							<span><ColumnTableCell value={field.value} /></span>
						{:else if fieldConfig.cell}
							{@const Cell = fieldConfig.cell}
							<span><Cell value={field.value} /></span>
						{:else}
							<span>{field.value}</span>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	{/each}
</div>

<style type="postcss">
	.rz-render-fields-preview {
		display: grid;
	}
	.rz-render-fields-preview__row {
		height: var(--rz-input-height);
		align-items: center;
		display: grid;
		grid-template-columns: minmax(var(--rz-size-24), var(--rz-size-32)) 1fr;
		padding-right: 0 var(--rz-size-4);
	}
	.rz-render-fields-preview__row:not(:last-child) {
		border-bottom: var(--rz-border);
	}
	.rz-render-fields-preview__name {
		height: calc(var(--rz-input-height) - 1px);
		background-color: hsl(var(--rz-color-bg));
		padding: 0 var(--rz-size-4);
		border-right: var(--rz-border);
		align-items: center;
		display: flex;
		> p {
			@mixin line-clamp 1;
		}
	}
	.rz-render-fields-preview__value {
		height: var(--rz-input-height);
		padding: 0 var(--rz-size-4);
		align-items: center;
		display: flex;
		span {
			@mixin line-clamp 1;
		}
	}
</style>
