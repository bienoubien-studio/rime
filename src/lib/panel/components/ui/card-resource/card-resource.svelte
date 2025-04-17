<script lang="ts">
	import { mimeTypeToIcon } from '$lib/panel/util/upload.js';
	import { X, Edit, FileIcon } from '@lucide/svelte';

	type Resource = {
		id: string;
		title: string;
		_type: string;
		mimeType?: string;
		filename?: string;
		filesize?: string;
		url?: string;
	};

	type Props = { resource: Resource; onCloseClick: () => void };
	const { resource, onCloseClick }: Props = $props();

	const isUpload = $derived('mimeType' in resource);
	const isImage = $derived(isUpload && resource.mimeType!.includes('image'));
	const Icon = $derived(isUpload ? mimeTypeToIcon(resource.mimeType!) : FileIcon);
</script>

<div class="rz-card-resource">
	<div class="rz-card-resource__thumbnail">
		{#if isImage}
			<img class="rz-card-resource__image" src={resource.url} alt={resource.filename} />
		{:else}
			<Icon class="rz-card-resource__icon" size={18} />
		{/if}
	</div>

	<div class="rz-card-resource__info">
    <p class="rz-card-resource__title">
      {resource.title} <a href="/panel/{resource._type}/{resource.id}"><Edit size="12" /></a>
    </p>
    {#if isUpload}
			<p class="rz-card-resource__info-text">{resource.filesize}</p>
			<p class="rz-card-resource__info-text">{resource.mimeType}</p>
		{/if}
	</div>

	<button type="button" class="rz-card-resource__remove" onclick={() => onCloseClick()}>
		<X size={11} />
	</button>
</div>

<style lang="postcss">
	.rz-card-resource {
		--rz-internal-padding: var(--rz-card-padding, var(--rz-size-2));
		--rz-internal-thumbnail-size: var(--rz-thumbnail-size, var(--rz-size-20));
		background-color: hsl(var(--rz-ground-6));
		position: relative;
		display: flex;
		gap: var(--rz-size-6);
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		padding: var(--rz-internal-padding);
    max-width: 400px;
	}
  
	.rz-card-resource__thumbnail {
		width: var(--rz-internal-thumbnail-size);
		height: var(--rz-internal-thumbnail-size);
		flex-shrink: 0;
		overflow: hidden;
    background-color: hsl(var(--rz-ground-5));
    display: flex;
    align-items: center;
    justify-content: center;
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

	.rz-card-resource__title {
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

	.rz-card-resource__info-text{
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
