<script lang="ts">
	import * as Card from '$lib/panel/components/ui/card/index';
	import type { GenericDoc } from '$lib/types';
	import UploadThumbCell from '../../../upload-thumb-cell/UploadThumbCell.svelte';
	import './document-card.css';

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

<Card.Root class="rz-document-card">
	<Card.Content>
		{#if hasPreview}
			<UploadThumbCell mimeType={doc.mimeType} class="rz-document-card__preview" url={thumbnailUrl} />
		{/if}
	</Card.Content>
	<Card.Footer>
		<p class="rz-document-card__title">
			{doc.title}
		</p>
		<div class="rz-document-card__metadata">
			<!-- {#each ['filesize', 'mimeType'] as key, index (index)} -->
			<p>{doc.mimeType}</p>
			<!-- {/each} -->
		</div>
	</Card.Footer>
</Card.Root>
