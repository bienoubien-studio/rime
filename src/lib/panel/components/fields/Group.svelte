<script lang="ts">
	import type { GroupField } from 'rizom/fields/group';
	import RenderFields from './RenderFields.svelte';
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import { isFormField } from 'rizom/fields/utility';
	import { onMount } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';

	type Props = { path: string; config: GroupField<'compiled'>; form: DocumentFormContext };
	const { config, path, form }: Props = $props();

	let groupOpen = $state(true);
	const key = `group-${config.fields
		.filter(isFormField)
		.map((f) => f.name)
		.join('-')}`;

	function handleClick() {
		groupOpen = !groupOpen;
		localStorage.setItem(key, groupOpen.toString());
	}

	onMount(() => {
		groupOpen = localStorage.getItem(key) === 'true';
	});
</script>

<button onclick={handleClick} type="button" class:open={groupOpen} class="rz-group-field__title">
	{config.label || 'Group'}
	<span><ChevronDown /></span>
</button>
{#if groupOpen}
	<RenderFields {path} fields={config.fields} framed={true} {form} />
{/if}

<style>
	.rz-group-field__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--rz-size-4);
		font-size: var(--rz-text-xl);
		padding: var(--rz-size-6) 0;
		position: relative;
		width: 100%;
		text-align: left;
		@mixin font-medium;

		&.open span {
			rotate: -180deg;
		}

		&:first-child {
			padding: 0 0 var(--rz-size-6) 0;
		}

		&::after {
			content: '';
			/* border-bottom: var(--rz-border); */
			border-bottom: 1px solid hsl(var(--rz-color-border) / 0.5);
			position: absolute;
			bottom: 0;
			left: calc(-1 * var(--rz-size-8));
			right: calc(-1 * var(--rz-size-8));
		}
		&:not(:first-child)::before {
			content: '';
			/* border-bottom: var(--rz-border); */
			border-top: var(--rz-border);
			position: absolute;
			bottom: 0;
			left: calc(-1 * var(--rz-size-8));
			right: calc(-1 * var(--rz-size-8));
		}
	}
</style>
