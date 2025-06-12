<script lang="ts">
	import { FileText } from '@lucide/svelte';
	import { mimeTypeToIcon } from '$lib/panel/util/upload.js';

	type Props = {
		url?: string;
		mimeType?: string;
		class?: string;
	};
	const { url, class: className, mimeType }: Props = $props();
</script>

<div class="rz-upload-preview-cell {className}">
	<div>
		{#if url && mimeType && mimeType.includes('image')}
			<img class="rz-upload-preview-cell__image" src={url} alt="preview" />
		{:else}
			<div class="rz-upload-preview-cell__placeholder">
				{#if mimeType}
					{@const FileIcon = mimeTypeToIcon(mimeType)}
					<FileIcon size={14} />
				{:else}
					<FileText size={14} />
				{/if}
			</div>
		{/if}
	</div>
</div>

<style type="postcss">
	.rz-upload-preview-cell {
		--size: var(--rz-upload-preview-cell-size, var(--rz-size-9));
		display: flex;
		width: var(--size);
		height: var(--size);
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: var(--rz-radius-sm);
		> div {
			width: 100%;
			height: 100%;
			border-radius: var(--rz-radius-sm);
			overflow: hidden;
			background: hsl(var(--rz-ground-6));
			display: flex;
			place-content: center;
		}
	}

	.rz-upload-preview-cell__image {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	.rz-upload-preview-cell__placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
