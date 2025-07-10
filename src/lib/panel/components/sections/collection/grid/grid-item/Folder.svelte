<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { Directory } from '$lib/core/collections/upload/upload.js';
	import { PARAMS } from '$lib/core/constant.js';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import ContextMenu from '$lib/panel/components/ui/context-menu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/panel/components/ui/context-menu/ContextMenuItem.svelte';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import { trycatchFetch } from '$lib/util/trycatch.js';
	import { toast } from 'svelte-sonner';
	import { t__ } from '../../../../../../core/i18n/index.js';
	import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { API_PROXY, getAPIProxyContext } from '$lib/panel/context/api-proxy.svelte.js';
	import type { GenericDoc } from '$lib/core/types/doc.js';

	type Props = {
		folder: Directory;
		slug: string;
		onDelete?: (path: string) => void;
		onDocumentDrop: (args: { documentId: string; path: string }) => void;
		draggable?: 'true';
	};
	const { folder, slug, onDelete, onDocumentDrop, draggable }: Props = $props();

	let deleteConfirmOpen = $state(false);
	let message = $state('');

	const isRoot = $derived(folder.name === '...');

	let rootElement = $state<HTMLButtonElement>();

	const APIProxy = getAPIProxyContext(API_PROXY.ROOT);

	const childFilesURL = $derived(`${env.PUBLIC_RIZOM_URL}/api/${slug}?where[_path][equals]=${folder.id}&select=id`);
	const childFiles = $derived(APIProxy.getRessource<{ docs: GenericDoc[] }>(childFilesURL));
	const childFilesCount = $derived(childFiles.data?.docs?.length || 0);

	const childFoldersURL = $derived(
		`${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(slug)}?where[parent][equals]=${folder.id}&select=id`
	);
	const childFolders = $derived(APIProxy.getRessource<{ docs: GenericDoc[] }>(childFoldersURL));
	const childFoldersCount = $derived(childFolders.data?.docs?.length || 0);

	async function handleGetDeleteInfos() {
		message = t__('common.delete_dialog_text', `wich contains ${childFilesCount + childFoldersCount} elements`);
		deleteConfirmOpen = true;
	}

	async function handleDelete() {
		const url = `${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(slug)}/${folder.id}`;
		const [error, _] = await trycatchFetch(url, { method: 'DELETE' })
		if (error) {
			return toast.error('Error deleting folder');
		}
		toast.success(t__('delete_success'));
		deleteConfirmOpen = false;
		if (onDelete) {
			onDelete(folder.id);
		}
	}

	async function handleDropFolder(folderId: string) {
		const movedFolderPath = folderId;
		const newFolderPath = `${folder.id}:${movedFolderPath.split(':').at(-1)}`;
		const moveAPICallURL = `${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(slug)}/${folderId}`;
		const [error, _] = await trycatchFetch(moveAPICallURL, {
			method: 'PATCH',
			body: JSON.stringify({ id: newFolderPath })
		});

		if (error) {
			console.error(error);
			return toast.error('Error moving folder');
		}

		toast.success('Folder moved successfully');
		childFolders.refresh();
		return invalidateAll();
	}

	async function handleDropDocument(docId: string) {
		const moveDocumentAPICallURL = `${env.PUBLIC_RIZOM_URL}/api/${slug}/${docId}`;
		const [error, _] = await trycatchFetch(moveDocumentAPICallURL, {
			method: 'PATCH',
			body: JSON.stringify({ _path: folder.id })
		});
		if (error) {
			console.error(error);
			return toast.error('Error moving document');
		}
		toast.success('Document moved successfully');
		if (onDocumentDrop) {
			onDocumentDrop({ documentId: docId, path: folder.id });
		}
		childFiles.refresh();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault(); // prevent default browser behavior
		rootElement?.classList.remove('rz-folder--dragover');
		// Get the document ID from dataTransfer
		const docId = e.dataTransfer?.getData('text/plain');
		if (!docId) return;
		// This is a folder move so update folder path
		if (docId.includes(':')) {
			return handleDropFolder(docId);
		}
		// Handle a drop document
		return handleDropDocument(docId);
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		rootElement?.classList.add('rz-folder--dragover');
	}

	function handleDragLeave() {
		rootElement?.classList.remove('rz-folder--dragover');
	}

	function handleGoToFolder() {
		goto(`${env.PUBLIC_RIZOM_URL}/panel/${slug}?${PARAMS.UPLOAD_PATH}=${folder.id}`);
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', folder.id);
	}
</script>

{#snippet folderContent()}
	<svg
		version="1.1"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		x="0px"
		y="0px"
		viewBox="0 0 500 400"
		xml:space="preserve"
	>
		<path
			d="M465.4,400H34.6C15.5,400,0,384.5,0,365.4V34.6C0,15.5,15.5,0,34.6,0c0,0,69,0,103,0c43.6,0,40.7,40,80.9,40
		c27.6,0,247,0,247,0c19.1,0,34.6,15.5,34.6,34.6v290.9C500,384.5,484.5,400,465.4,400z"
		/>

		<path
			d="M465.4,400H34.6C15.5,400,0,384.5,0,365.4V106.5C0,87.4,15.5,72,34.6,72h430.9c19.1,0,34.6,15.5,34.6,34.6
		v258.9C500,384.5,484.5,400,465.4,400z"
		/>
	</svg>
	<h3>
		{folder.name}
	</h3>
{/snippet}

<button
	bind:this={rootElement}
	onclick={handleGoToFolder}
	class="rz-folder"
	ondragleave={handleDragLeave}
	ondragover={handleDragEnter}
	ondrop={handleDrop}
	draggable={draggable === 'true' ? 'true' : null}
	ondragstart={draggable === 'true' ? handleDragStart : null}
>
	{#if !isRoot}
		<ContextMenu>
			{#snippet trigger()}
				{@render folderContent()}
			{/snippet}
			{#snippet content()}
				<ContextMenuItem onclick={handleGetDeleteInfos}>Delete</ContextMenuItem>
			{/snippet}
		</ContextMenu>
	{:else}
		{@render folderContent()}
	{/if}
	{#if !isRoot}
		<span>{childFilesCount + childFoldersCount} items</span>
	{:else}
		<span></span>
	{/if}
</button>

<Dialog.Root bind:open={deleteConfirmOpen}>
	<Dialog.Content>
		<Dialog.Header>
			{t__('common.delete_dialog_title', folder.name)}
		</Dialog.Header>
		<p>{message}</p>
		<Dialog.Footer --rz-justify-content="space-between">
			<Button onclick={handleDelete}>Delete</Button>
			<Button onclick={() => (deleteConfirmOpen = false)} variant="secondary">Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style lang="postcss">
	:root{
		--rz-folder-light: light-dark(hsl(var(--rz-gray-12)), hsl(var(--rz-gray-6)));
		--rz-folder-dark: light-dark(hsl(var(--rz-gray-10)), hsl(var(--rz-gray-4)));
		--rz-folder-hover-bg: light-dark(hsl(var(--rz-gray-14)), hsl(var(--rz-gray-1)));
	}

	.rz-folder {
		width: 100%;
		aspect-ratio: 5/4;
		padding: var(--rz-size-5);
		border-radius: var(--rz-radius-lg);
		h3 {
			@mixin font-semibold;
			text-align: center;
			padding: var(--rz-size-3);
		}
		svg {
			aspect-ratio: 5 / 4;
			width: 100%;
		}
		:global {
			path:first-child {
				fill: var(--rz-folder-dark);
			}
			path:last-child {
				fill: var(--rz-folder-light);
			}
		}
		:global {
			&.rz-folder--dragover {
				background-color: var(--rz-folder-hover-bg);
			}
		}
	}

	.rz-folder:hover {
		background-color: var(--rz-folder-hover-bg);
	}
</style>
