<script lang="ts">
	import { type CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import Checkbox from '$lib/panel/components/ui/checkbox/checkbox.svelte';
	import { isUploadConfig } from '$lib/util/config.js';
	import UploadThumbCell from '../../upload-thumb-cell/UploadThumbCell.svelte';
	import * as Card from '$lib/panel/components/ui/card/index';
	import { getContext } from 'svelte';
	import type { GenericDoc } from '$lib/core/types/doc';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';

	type Props = { checked: boolean; doc: GenericDoc; draggable?: 'true' };
	const { checked, doc, draggable }: Props = $props();

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const isUploadCollection = $derived(isUploadConfig(collection.config));
	const thumbnailUrl = $derived.by(() => {
		if (isUploadConfig(collection.config) && doc.mimeType && doc.mimeType.includes('image')) {
			return doc._thumbnail;
		}
		return null;
	});

	function handleEdit() {
		const uploadPath = isUploadCollection ? page.url.searchParams.get(PARAMS.UPLOAD_PATH) || UPLOAD_PATH.ROOT_NAME : null
		const params = uploadPath ? `?${PARAMS.UPLOAD_PATH}=${uploadPath}` : ''
		goto(`/panel/${collection.config.slug}/${doc.id}${params}`);
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', doc.id);
	}
</script>

{#snippet card(doc: GenericDoc)}
	<Card.Root class="rz-grid-item__card">
		<Card.Content>
			{#if isUploadCollection}
				<UploadThumbCell mimeType={doc.mimeType} class="rz-grid-item__preview" url={thumbnailUrl} />
			{/if}
		</Card.Content>
		<Card.Footer>
			<p class="rz-grid-item__title">
				{doc.title}
			</p>
			<div class="rz-grid-item__metadata">
				{#each ['filesize', 'mimeType'] as key, index (index)}
					<p class="rz-grid-item__metadata">{doc[key]}</p>
				{/each}
			</div>
		</Card.Footer>
	</Card.Root>
{/snippet}

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
		{@render card(doc)}
	</div>
{:else}
	<button
		class="rz-grid-item"
		onclick={handleEdit}
		draggable={draggable || null}
		ondragstart={draggable ? handleDragStart : null}
	>
		{@render card(doc)}
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

		:global(.rz-upload-preview-cell) {
			width: 100%;
			height: 100%;
			aspect-ratio: 5/4;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			padding: var(--rz-size-1);

			> :global(div) {
				border-radius: var(--rz-radius-sm);
				overflow: hidden;
			}
		}

		:global(.rz-card-content) {
			padding: 0;
		}
		:global(.rz-card-footer) {
			display: block;
			padding: 0 0.6rem 0.6rem 0.6rem;
		}
	}

	.rz-grid-item__select-button {
		position: absolute;
		left: var(--rz-size-2);
		top: var(--rz-size-2);
	}

	.rz-grid-item__title {
		margin-top: var(--rz-size-2);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-all;
		font-size: var(--rz-text-xs);
		@mixin font-bold;
	}

	.rz-grid-item__metadata {
		font-size: var(--rz-text-xs);
		display: none;
		@container collection-area (min-width:420px) {
			display: block;
		}
	}
</style>
