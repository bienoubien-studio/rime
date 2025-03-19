<script lang="ts">
	import {
		isComponentField,
		isGroupFieldRaw,
		isLiveField,
		isNotHidden,
		isPresentative,
		isTabsField,
		isTabsFieldRaw
	} from '$lib/util/field.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import type { Field, FieldsType, FormField, AnyField } from 'rizom/types/fields.js';
	import { getConfigContext } from 'rizom/panel/context/config.svelte.js';
	import type { Component } from 'svelte';

	type Props = {
		path?: string;
		fields: Field[];
		framed?: boolean;
		form: DocumentFormContext;
	};

	const { form, fields, path: initialPath = '', framed = false }: Props = $props();

	const user = getUserContext();
	const config = getConfigContext();

	const fieldComponent = (
		type: FieldsType
	): Component<{ path: string; config: Field; form: typeof form }> => {
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
	const framedClassModifier = $derived(framed ? 'rz-render-fields--framed' : '');

	const widthClassModifier = (field: FormField) =>
		`rz-render-fields__field--${field.width || 'full'}`;

	//
</script>

<div class="rz-render-fields {framedClassModifier}">
	{#each authorizedFields as field}
		{#if !form.isLive || (form.isLive && isLiveField(field))}
			{console.log(field.type || '——')}
			{#if isComponentField(field)}
				{console.log(1)}
				{@const FieldComponent = field.component}
				<div data-type={field.type} class="rz-render-fields__field rz-render-fields__field--full">
					<FieldComponent {path} config={field} {form} />
				</div>
			{:else if isPresentative(field)}
				{console.log(2)}
				{@const Separator = config.raw.blueprints.separator.component}
				<div data-type={field.type} class="rz-render-fields__field rz-render-fields__field--full">
					<Separator />
				</div>
			{:else if isTabsField(field)}
				{console.log(3)}
				{@const Tabs = config.raw.blueprints.tabs.component}
				<div data-type="tabs" class="rz-render-fields__field rz-render-fields__field--full">
					<Tabs config={field} {path} {form} />
				</div>
			{:else if isNotHidden(field)}
				{console.log(4, field.type)}
				{@const FieldComponent = fieldComponent(field.type)}
				<div class="rz-render-fields__field {widthClassModifier(field)}" data-type={field.type}>
					{#if isGroupFieldRaw(field)}
						{console.log(FieldComponent)}
					{/if}
					<FieldComponent path={path + field.name} config={field} {form} />
				</div>
			{:else}
				{console.log(5)}
			{/if}
		{/if}
	{/each}
</div>

<style type="postcss">
	.rz-render-fields {
		position: relative;
		margin-bottom: var(--rz-size-4);
		gap: var(--rz-size-8) 0;
		display: grid;
		container-type: inline-size;
		grid-template-columns: repeat(12, 1fr);
		& > * {
			position: relative;
		}
		&:not(.rz-render-fields--framed) :global(.rz-field-root) {
			padding-left: var(--rz-fields-padding);
			padding-right: var(--rz-fields-padding);
		}
	}

	.rz-render-fields--framed {
		position: relative;
		/* padding: 0 var(--rz-size-4); */
		padding: var(--rz-size-6) var(--rz-size-6) var(--rz-size-12) var(--rz-size-6);
		&::after {
			content: '';
			border-bottom: var(--rz-border);
			position: absolute;
			bottom: 0;
			left: calc(-1 * var(--rz-size-8));
			right: calc(-1 * var(--rz-size-8));
		}
	}

	/** hide fields that doesn't have any data-visible children */
	.rz-render-fields__field:not(:has(.rz-field-root[data-visible])) {
		display: none;
	}

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
