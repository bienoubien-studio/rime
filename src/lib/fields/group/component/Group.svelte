<script lang="ts">
	import { ChevronDown, FolderClosed, FolderOpen } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { isFormField } from '$lib/util/field.js';
	import RenderFields from '$lib/panel/components/fields/RenderFields.svelte';
	import RenderFieldsPreview from '$lib/panel/components/fields/RenderFieldsPreview.svelte';
	import type { GroupField } from '$lib/fields/group/index.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
	import type { WithoutBuilders } from '$lib/util/types.js';
	import type { GenericDoc } from '$lib/core/types/doc.js';

	type Props = {
		path: string;
		config: WithoutBuilders<GroupField>;
		form: DocumentFormContext<GenericDoc>;
	};
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

<div class="rz-group-field__wrapper">
	<button
		onclick={handleClick}
		type="button"
		class:open={groupOpen}
		class:rz-group-field__title--live={form.isLive}
		class="rz-group-field__title"
	>
		<span>
			{#if groupOpen}
				<FolderOpen size="12" />
			{:else}
				<FolderClosed size="12" />
			{/if}
			{config.label || config.name || 'Group'}
		</span>
		<ChevronDown size="14" />
	</button>

	{#if !groupOpen}
		<button class="rz-group-field__preview" onclick={handleClick} type="button">
			<RenderFieldsPreview {path} fields={config.fields} {form} />
		</button>
	{:else}
		<div class="rz-group-field__content">
			<RenderFields {path} fields={config.fields} {form} />
		</div>
	{/if}
</div>

<style lang="postcss">
	.rz-group-field__wrapper {
		border: var(--rz-border);
		border-radius: var(--rz-radius-md);
		background-color: hsl(var(--rz-ground-6));
		&:global(:has(.rz-field-error)) {
			@mixin ring var(--rz-color-error);
		}
	}
	.rz-group-field__preview {
		display: block;
		width: 100%;
		text-align: left;
	}

	.rz-group-field__content {
		--rz-fields-padding: var(--rz-size-5);
		padding-top: var(--rz-fields-padding);
		padding-bottom: var(--rz-fields-padding);
		background-color: hsl(var(--rz-ground-6));
	}

	.rz-group-field__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--rz-size-2);
		padding: 0 var(--rz-size-4);
		height: var(--rz-input-height);
		position: relative;
		width: 100%;
		text-align: left;
		border-bottom: var(--rz-border);
		@mixin font-semibold;
		> span {
			gap: var(--rz-size-2);
			display: flex;
			align-items: center;
		}

		&.open :global(.lucide-chevron-down) {
			rotate: -180deg;
		}
	}
	.rz-group-field__title--live {
		font-size: var(--rz-text-md);
	}
</style>
