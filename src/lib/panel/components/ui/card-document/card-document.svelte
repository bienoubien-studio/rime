<script lang="ts">
	import type { GenericDoc } from '$lib/types';
	import UploadThumbCell from '../../sections/collection/upload-thumb-cell/UploadThumbCell.svelte';

	type Props = { doc: GenericDoc };
	const { doc }: Props = $props();

	const hasPreview = $derived(doc.mimeType && doc.mimeType.includes('image'));
	const thumbnailUrl = $derived.by(() => {
		if (doc.mimeType && doc.mimeType.includes('image')) {
			return doc._thumbnail;
		}
		return null;
	});
</script>

<div class="rz-document-card">
	<div class="rz-document-card__preview">
		{#if hasPreview}
			<UploadThumbCell mimeType={doc.mimeType} url={thumbnailUrl} />
		{/if}
	</div>

	<div class="rz-document-card__body">
		<p class="rz-document-card__title">
			{doc.title}
		</p>

		<div class="rz-document-card__metadata">
			{#each ['filesize', 'mimeType'] as key, index (index)}
				<p>{doc[key]}</p>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	/** */
	:root {
		--rz-card-hover-bg: light-dark(hsl(var(--rz-gray-14)), hsl(var(--rz-gray-1)));
	}

	.rz-document-card {
		border: var(--rz-border);
		background-color: var(--rz-card-bg);
		border-radius: var(--rz-radius-lg);
		aspect-ratio: 4 / 5;
		width: 100%;
	}

	.rz-document-card:hover {
		background-color: var(--rz-card-hover-bg);
	}

	.rz-document-card :global(.rz-upload-preview-cell) {
		width: 100%;
		height: 100%;
		aspect-ratio: 5/4;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		padding: var(--rz-size-1);

		> div {
			border-radius: var(--rz-radius-sm);
			overflow: hidden;
		}
	}

	.rz-document-card__title {
		margin-top: var(--rz-size-2);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-all;
		text-align: left;
		font-size: var(--rz-text-xs);
		@mixin font-bold;
	}

	.rz-document-card__body {
		display: block;
		text-align: left;
		padding: 0 0.6rem 0.6rem 0.6rem;
	}

	.rz-document-card__metadata {
		font-size: var(--rz-text-xs);
		opacity: 0.6;
	}
</style>
