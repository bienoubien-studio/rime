<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';
	import type { GenericDoc } from '$lib/core/types/doc';
	import Checkbox from '$lib/panel/components/ui/checkbox/checkbox.svelte';
	import { type CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { isUploadConfig } from '$lib/util/config.js';
	import { getContext } from 'svelte';
	import DocumentCard from './document-card/DocumentCard.svelte';

	type Props = { checked: boolean; doc: GenericDoc; draggable?: 'true' };
	const { checked, doc, draggable }: Props = $props();

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const isUploadCollection = $derived(isUploadConfig(collection.config));

	function handleEdit() {
		const uploadPath = isUploadCollection
			? page.url.searchParams.get(PARAMS.UPLOAD_PATH) || UPLOAD_PATH.ROOT_NAME
			: null;
		const params = uploadPath ? `?${PARAMS.UPLOAD_PATH}=${uploadPath}` : '';
		goto(`/panel/${collection.config.slug}/${doc.id}${params}`);
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', doc.id);
	}
</script>

{#if collection.selectMode}
	<div class="rz-grid-item">
		<button
			onclick={() => collection.toggleSelectOf(doc.id)}
			type="button"
			aria-label="select"
			class="rz-grid-item__select-button"
		>
			<Checkbox {checked} />
		</button>
		<DocumentCard {doc} />
	</div>
{:else}
	<button
		class="rz-grid-item"
		onclick={handleEdit}
		draggable={draggable || null}
		ondragstart={draggable ? handleDragStart : null}
	>
		<DocumentCard {doc} />
	</button>
{/if}

<style lang="postcss">
	button.rz-grid-item {
		text-align: left;
	}
	.rz-grid-item {
		--checkbox-border: hsl(var(--rz-gray-10));
		--rz-card-color-bg: var(--rz-gray-10);
		display: block;
		position: relative;
	}

	.rz-grid-item__select-button {
		position: absolute;
		left: var(--rz-size-2);
		top: var(--rz-size-2);
	}
</style>
