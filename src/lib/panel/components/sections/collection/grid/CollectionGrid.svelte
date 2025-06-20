<script lang="ts">
	import type { CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import GridItem from './grid-item/GridItem.svelte';
	import Folder from './grid-item/Folder.svelte';
	import Empty from '../Empty.svelte';

	type Props = { collection: CollectionContext };
	const { collection }: Props = $props();

	const currentPathDocuments = $derived(collection.docs.filter((doc) => doc._path === collection.upload.currentPath));
	function onDeleteFolder(path: string) {
		collection.upload.directories = collection.upload.directories.filter((dir) => dir.id !== path);
	}

	/**
	 * When a document is moved into a folder
	 * change the document path inside collection.docs
	 */
	function onDocumentMove(args: { documentId: string; path: string }) {
		const { documentId, path } = args;
		const docIndex = collection.docs.findIndex((doc) => doc.id === documentId);
		if (docIndex > -1) {
			collection.docs[docIndex]._path = path;
		} else {
			console.error("can't find " + documentId, collection.docs);
		}
	}

	const dragEnabled = $derived(!!(collection.upload.directories.length || collection.upload.parentDirectory));
</script>

{#if collection.docs.length || collection.upload.directories || collection.upload.parentDirectory}
	<div class="rz-page-collection__grid">
		<!-- Parent directory -->
		{#if collection.upload.parentDirectory}
			<Folder
				onMoveInside={onDocumentMove}
				folder={{ ...collection.upload.parentDirectory, name: '...' }}
				slug={collection.config.slug}
			/>
		{/if}

		<!-- All children directories -->
		{#each collection.upload.directories as folder (folder.id)}
			<Folder onMoveInside={onDocumentMove} {folder} slug={collection.config.slug} onDelete={onDeleteFolder} />
		{/each}

		<!-- All children docs -->
		{#each currentPathDocuments as doc (doc.id)}
			{@const checked = collection.selected.includes(doc.id)}
			{#if dragEnabled}
				<GridItem draggable="true" {doc} {checked} />
			{:else}
				<GridItem {doc} {checked} />
			{/if}
		{/each}
	</div>
{:else}
	<Empty {collection} />
{/if}

<style lang="postcss">
	.rz-page-collection__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--rz-size-4);
		@container collection-area (min-width:420px) {
			gap: var(--rz-size-8);
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		}
	}
</style>
