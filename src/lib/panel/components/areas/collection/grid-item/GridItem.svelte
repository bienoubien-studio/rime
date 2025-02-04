<script lang="ts">
	import { type CollectionContext } from 'rizom/panel/context/collection.svelte';
	import Checkbox from '$lib/panel/components/ui/checkbox/checkbox.svelte';
	import { getPanelThumbnailKey, isUploadConfig } from '$lib/config/utils';
	import UploadThumbCell from '../upload-thumb-cell/UploadThumbCell.svelte';
	import * as Card from '$lib/panel/components/ui/card/index';
	import { getContext } from 'svelte';
	import type { GenericDoc } from 'rizom/types/doc';

	type Props = { checked: boolean; doc: GenericDoc };
	const { checked, doc }: Props = $props();

	const collection = getContext<CollectionContext>('collectionList');

	const isUploadCollection = $derived(isUploadConfig(collection.config));
	const thumbnailUrl = $derived.by(() => {
		if (isUploadConfig(collection.config)) {
			const thumbnailKey = getPanelThumbnailKey(collection.config);
			return doc[thumbnailKey];
		}
		return null;
	});
</script>

{#snippet card(doc: GenericDoc)}
	<Card.Root class="rz-grid-item__card">
		<Card.Content>
			{#if isUploadCollection}
				<UploadThumbCell class="rz-grid-item__preview" url={thumbnailUrl} />
			{/if}
		</Card.Content>
		<Card.Footer>
			<p class="rz-grid-item__title">
				{doc.title}
			</p>
			<div class="rz-grid-item__metadata">
				{#each ['filesize', 'mimeType'] as key}
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
	<a href="/panel/{collection.config.slug}/{doc.id}" class="rz-grid-item">
		{@render card(doc)}
	</a>
{/if}

<style lang="postcss">
	.rz-grid-item {
		--checkbox-border: hsl(var(--rz-ground-6));
		display: block;
		position: relative;

		:global(.rz-upload-preview-cell) {
			width: 100%;
			height: 100%;
			aspect-ratio: 16/9;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			padding: var(--rz-size-2);
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
		}
	}

	.rz-grid-item__select-button {
		position: absolute;
		left: var(--rz-size-2);
		top: var(--rz-size-2);
	}

	.rz-grid-item__title {
		margin-top: var(--rz-size-4);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-all;
		font-size: var(--rz-text-xs);
		@mixin font-bold;
	}

	.rz-grid-item__metadata {
		margin-top: var(--rz-size-1);
		margin-bottom: var(--rz-size-1);
		font-size: var(--rz-text-xs);
	}
</style>
