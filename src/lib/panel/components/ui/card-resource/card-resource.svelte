<script lang="ts">
	import type { GenericDoc } from 'rizom/types';
	import { mimeTypeToIcon } from 'rizom/panel/util/upload.js';
	import { X, Edit, FileIcon } from '@lucide/svelte';

	type Props = { resource: GenericDoc; onCloseClick: () => void };
	const { resource, onCloseClick }: Props = $props();

	const isUpload = $derived('mimeType' in resource);
	const isImage = $derived(isUpload && resource.mimeType.includes('image'));
	const Icon = $derived(isUpload ? mimeTypeToIcon(resource.mimeType) : FileIcon);
</script>

<div class="rz-card-resource">
	<div class="rz-card-resource__thumbnail">
		{#if isImage}
			<img class="rz-card-resource__image" src={resource.url} alt={resource.filename} />
		{:else}
			<Icon size={18} />
		{/if}
	</div>

	<div class="rz-card-resource__info">
		{#if isUpload}
			<p class="rz-card-resource__filename">
				{resource.filename} <a href="/panel/{resource._type}/{resource.id}"><Edit size="12" /></a>
			</p>
			<p class="rz-card-resource__filesize">{resource.filesize}</p>
			<p class="rz-card-resource__mimetype">{resource.mimeType}</p>
		{/if}
	</div>

	<button type="button" class="rz-card-resource__remove" onclick={() => onCloseClick()}>
		<X size={11} />
	</button>
</div>

<style lang="postcss">
	
	.rz-card-resource {
		--rz-thumbnail-size: var(--rz-size-20);
		background-color: hsl(var(--rz-ground-6));
		position: relative;
		display: flex;
		gap: var(--rz-size-6);
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		padding: var(--rz-size-2);

		@container relation-upload-list (min-width: 425px) {
			--rz-thumbnail-size: var(--rz-size-28);
		}
		@container relation-upload-list (min-width: 768px) {
			--rz-thumbnail-size: var(--rz-size-40);
		}
	}

	.rz-card-resource__thumbnail {
		width: var(--rz-thumbnail-size);
		height: var(--rz-thumbnail-size);
		flex-shrink: 0;
		overflow: hidden;
		border-radius: var(--rz-radius-md);
	}

	.rz-card-resource__image {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	.rz-card-resource__info {
		margin-top: var(--rz-size-3);
		padding-right: 2rem;
	}

	.rz-card-resource__filename {
		font-size: var(--rz-text-sm);
		@mixin font-semibold;
		a {
			display: inline-block;
			padding: 0 0.3rem;
			:global(svg) {
				translate: 0 0.25rem;
			}
		}
	}

	.rz-card-resource__filesize,
	.rz-card-resource__mimetype {
		font-size: var(--rz-text-sm);
	}

	.rz-card-resource__remove {
		position: absolute;
		right: var(--rz-size-3);
		top: var(--rz-size-3);
		border: var(--rz-border);
		background-color: hsl(var(--rz-ground-6));
		border-radius: 1rem;
		height: var(--rz-size-4);
		width: var(--rz-size-4);
		display: flex;
		align-items: center;
		justify-content: center;
	}
  
</style>
