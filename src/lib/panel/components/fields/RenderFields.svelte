<script lang="ts">
	import { isComponentField, isLiveField, isNotHidden, isPresentative } from '$lib/utils/field.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import type { AnyField, AnyFormField, FieldsType } from 'rizom/types/fields.js';
	import RenderFields from './RenderFields.svelte';
	import { getConfigContext } from 'rizom/panel/context/config.svelte.js';
	import type { WithoutBuilders } from 'rizom/types/utility';
	import Group from './Group.svelte';

	type Props = {
		path?: string;
		fields: AnyField[];
		framed?: boolean;
		form: DocumentFormContext;
	};

	const { form, fields, path: initialPath = '', framed = false }: Props = $props();

	const user = getUserContext();
	const config = getConfigContext();

	const fieldComponent = (type: FieldsType): any => {
		return config.raw.blueprints[type].component || null;
	};

	const authorizedFields = $derived(
		fields.filter((field) => {
			if (isPresentative(field)) return true;
			if (field.access && field.access.read) {
				return field.access.read(user.attributes, { id: form.doc.id });
			}
			return true;
		})
	);

	const path = $derived(initialPath === '' ? '' : `${initialPath}.`);
	const framedClassModifier = $derived(framed ? 'rz-render-fields--framed' : '');
	const widthClassModifier = (field: AnyFormField) =>
		`rz-render-fields__field--${field.width || 'full'}`;

	//
</script>

<div class="rz-render-fields {framedClassModifier}">
	{#each authorizedFields as field}
		{#if !form.isLive || (form.isLive && isLiveField(field))}
			{#if isComponentField(field)}
				{@const FieldComponent = field.component}
				<div class="rz-render-fields__field rz-render-fields__field--full">
					<FieldComponent {path} config={field} {form} />
				</div>
			{:else if isPresentative(field)}
				<div class="rz-render-fields__field rz-render-fields__field--full">
					{#if field.type === 'group'}
						<Group config={field} {path} {form} />
					{:else if field.type === 'tabs'}
						{@const Tabs = config.raw.blueprints.tabs.component}
						<Tabs config={field} {path} {form} />
					{:else}
						{@const Separator = config.raw.blueprints.separator.component}
						<Separator />
					{/if}
				</div>
			{:else if isNotHidden(field)}
				{@const FieldComponent = fieldComponent(field.type)}
				<div class="rz-render-fields__field {widthClassModifier(field)}">
					<FieldComponent path={path + field.name} config={field} {form} />
				</div>
			{/if}
		{/if}
	{/each}
</div>

<style type="postcss">
	.rz-render-fields {
		position: relative;
		margin-bottom: var(--rz-size-4);
		gap: var(--rz-size-8);
		display: grid;
		container-type: inline-size;
		grid-template-columns: repeat(12, 1fr);
		& > * {
			position: relative;
		}
	}

	.rz-render-fields--framed {
		position: relative;
		padding-bottom: var(--rz-size-12);
		padding-top: var(--rz-size-6);

		&::after {
			content: '';
			border-bottom: var(--rz-border);
			position: absolute;
			bottom: 0;
			left: calc(-1 * var(--rz-size-8));
			right: calc(-1 * var(--rz-size-8));
		}
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
