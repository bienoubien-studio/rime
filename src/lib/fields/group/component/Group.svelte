<script lang="ts">
	import { ChevronDown, FolderClosed, FolderOpen } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { isFormField } from '$lib/util/field.js';
	import RenderFields from '$lib/panel/components/fields/RenderFields.svelte';
	import type { GroupField } from '$lib/fields/group/index.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
	import type { WithoutBuilders } from '$lib/types/util.js';
	import type { GenericDoc } from '$lib/types/doc.js';

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

	<div class="rz-group-field__content" class:rz-group-field__content--hidden={!groupOpen}>
		<RenderFields {path} fields={config.fields} {form} />
	</div>
</div>

<style lang="postcss">
	.rz-group-field__wrapper {
		border: var(--rz-border);
		/* margin: 0 var(--rz-fields-padding); */
		border-radius: var(--rz-radius-md);
		&:global(:has(.rz-field-error)) {
			@mixin ring var(--rz-color-error);
		}
	}

	.rz-group-field__content {
		--rz-fields-padding: var(--rz-size-5);
		padding-top: var(--rz-fields-padding);
		padding-bottom: var(--rz-fields-padding);
		background-color: hsl(var(--rz-ground-6));
	}
	.rz-group-field__content--hidden {
		display: none;
	}
	.rz-group-field__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--rz-size-2);
		font-size: var(--rz-text-xl);

		padding: var(--rz-size-3) var(--rz-size-4);
		position: relative;
		width: 100%;
		text-align: left;
		@mixin font-medium;
		> span {
			gap: var(--rz-size-2);
			display: flex;
			align-items: center;
		}
		&.open {
			border-bottom: var(--rz-border);
		}
		&.open :global(.lucide-chevron-down) {
			rotate: -180deg;
		}
	}
	.rz-group-field__title--live {
		font-size: var(--rz-text-md);
		/* padding: var(--rz-size-4) var(--rz-fields-padding); */
	}
</style>
