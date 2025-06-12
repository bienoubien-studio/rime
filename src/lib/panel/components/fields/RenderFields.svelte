<script lang="ts">
	import { isComponentField, isLiveField, isNotHidden, isPresentative, isTabsField } from '$lib/util/field.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import type { Field, FieldsType, FormField, AnyField } from '$lib/fields/types.js';
	import { getConfigContext } from '$lib/panel/context/config.svelte.js';
	import type { Component } from 'svelte';

	type Props = {
		path?: string;
		fields: Field[];
		form: DocumentFormContext;
	};

	const { form, fields, path: initialPath = '' }: Props = $props();

	const user = getUserContext();
	const config = getConfigContext();

	const fieldComponent = (type: FieldsType): Component<{ path: string; config: Field; form: typeof form }> => {
		return config.raw.blueprints[type].component || null;
	};

	const authorizedFields = $derived(
		fields.filter((field) => {
			// if (isPresentative(field)) return true;
			if (field.access && field.access.read) {
				return field.access.read(user.attributes, { id: form.doc.id });
			}
			return true;
		}) as AnyField[]
	);

	const path = $derived(initialPath === '' ? '' : `${initialPath}.`);

	const widthClassModifier = (field: FormField) => `rz-render-fields__field--${field.width || 'full'}`;

	//
</script>

<div class="rz-render-fields">
	{#each authorizedFields as field, index (index)}
		{#if !form.isLive || (form.isLive && isLiveField(field))}
			{#if isComponentField(field)}
				{@const FieldComponent = field.component}
				<div data-type={field.type} class="rz-render-fields__field rz-render-fields__field--full">
					<FieldComponent {path} config={field} {form} />
				</div>
			{:else if isPresentative(field)}
				{@const Separator = config.raw.blueprints.separator.component}
				<div data-type={field.type} class="rz-render-fields__field rz-render-fields__field--full">
					<Separator />
				</div>
			{:else if isTabsField(field)}
				{@const Tabs = config.raw.blueprints.tabs.component}
				<div data-type="tabs" class="rz-render-fields__field rz-render-fields__field--full">
					<Tabs config={field} {path} {form} />
				</div>
			{:else if isNotHidden(field)}
				{@const FieldComponent = fieldComponent(field.type)}
				<div class="rz-render-fields__field {widthClassModifier(field)}" data-type={field.type}>
					<FieldComponent path={path + field.name} config={field} {form} />
				</div>
			{/if}
		{/if}
	{/each}
</div>

<style type="postcss">
	.rz-render-fields {
		position: relative;
		gap: var(--rz-size-8);
		display: grid;
		container-type: inline-size;
		grid-template-columns: repeat(12, 1fr);
		height: fit-content;
		padding-left: var(--rz-fields-padding);
		padding-right: var(--rz-fields-padding);

		& > * {
			position: relative;
		}
	}

	/** hide fields that doesn't have any data-visible children */
	/* .rz-render-fields__field:not(.rz-render-fields__field[data-type='component']):not(
			.rz-render-fields__field[data-type='separator']
		):not(:has(.rz-field-root[data-visible])) {
		display: none;
	} */

	.rz-render-fields__field--full,
	.rz-render-fields__field--1\/2,
	.rz-render-fields__field--1\/3,
	.rz-render-fields__field--2\/3 {
		grid-column: span 12 / span 12;
	}

	@container (min-width: 700px) {
		.rz-render-fields__field--1\/3 {
			grid-column: span 4 / span 4;
		}
		.rz-render-fields__field--2\/3 {
			grid-column: span 8 / span 8;
		}
		.rz-render-fields__field--1\/2 {
			grid-column: span 6 / span 6;
		}
		.rz-render-fields__field--full {
			grid-column: span 12 / span 12;
		}
	}
</style>
