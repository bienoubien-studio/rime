<script lang="ts">
	import type { GroupField } from 'rizom/fields/group';
	import RenderFields from './RenderFields.svelte';
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import { onMount } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';
	import type { WithoutBuilders } from 'rizom/types/utility';
	import { isFormField } from 'rizom/utils/field';

	type Props = { path: string; config: WithoutBuilders<GroupField>; form: DocumentFormContext };
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

<button
	onclick={handleClick}
	type="button"
	class:open={groupOpen}
	class:rz-group-field__title--live={form.isLive}
	class="rz-group-field__title"
>
	<span><ChevronDown size="14" /></span>
	{config.label || 'Group'}
</button>
{#if groupOpen}
	<div class="rz-group-field__content">
		<RenderFields {path} fields={config.fields} framed={true} {form} />
	</div>
{/if}

<style lang="postcss">
	.rz-group-field__content {
		padding-top: var(--rz-size-4);
		background-color: hsl(var(--rz-ground-6));
		> :global(.rz-render-fields) {
			padding-left: 0;
			padding-right: 0;
		}
	}
	.rz-group-field__title {
		border-bottom: var(--rz-border);
		display: flex;
		align-items: center;
		justify-content: start;
		gap: var(--rz-size-2);
		font-size: var(--rz-text-xl);
		padding: var(--rz-size-6) var(--rz-fields-padding);
		position: relative;
		width: 100%;
		text-align: left;
		@mixin font-medium;
		&:not(:first-child) {
			border-top: var(--rz-border);
		}
		&.open span {
			rotate: -180deg;
		}
	}
	.rz-group-field__title--live {
		font-size: var(--rz-text-md);
		padding: var(--rz-size-4) var(--rz-fields-padding);
	}
</style>
