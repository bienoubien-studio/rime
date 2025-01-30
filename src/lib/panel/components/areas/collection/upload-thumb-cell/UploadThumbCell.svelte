<script lang="ts">
	import { FileText } from 'lucide-svelte';

	type Props = {
		url: string;
		class?: string;
	};
	const { url, class: className }: Props = $props();
</script>

<div class="rz-upload-preview-cell {className}">
	{#if url}
		<img class="rz-upload-preview-cell__image" src={url} alt="preview" />
	{:else}
		<div class="rz-upload-preview-cell__placeholder">
			<FileText size={14} />
		</div>
	{/if}
</div>

<style type="postcss">
	.rz-upload-preview-cell {
		background: hsl(var(--rz-ground-4));
		display: flex;
		width: var(--rz-size-9);
		height: var(--rz-size-9);
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: var(--rz-radius-sm);
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
