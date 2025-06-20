<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { Directory } from '$lib/core/collections/upload/upload.js';
	import { PARAMS } from '$lib/core/constant.js';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import ContextMenu from '$lib/panel/components/ui/context-menu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/panel/components/ui/context-menu/ContextMenuItem.svelte';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import { trycatch } from '$lib/util/trycatch.js';
	import { toast } from 'svelte-sonner';
	import { t__ } from '../../../../../../core/i18n/index.js';
	import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';

	type Props = {
		folder: Directory;
		slug: string;
		onDelete?: (path: string) => void;
		onMoveInside: (args: { documentId: string; path: string }) => void;
	};
	const { folder, slug, onDelete, onMoveInside }: Props = $props();

	let deleteConfirmOpen = $state(false);
	let filesToDeleteCount = $state(0);
	let foldersToDeleteCount = $state(0);
	let message = $state('');

	const isRoot = $derived(folder.name === '...');

	let anchorElement = $state<HTMLAnchorElement>();

	async function handleGetDeleteInfos() {
		// Get number of files inside this folder
		const urlFiles = `${env.PUBLIC_RIZOM_URL}/api/${slug}?where[_path][like]=${folder.id}&select=id`;
		const [errorFiles, resultFiles] = await trycatch(fetch(urlFiles).then((r) => r.json()));
		if (errorFiles) {
			return toast.error('Error retrieving folder content');
		}
		// Get number of folder inside this folder
		const urlFolders = `${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(slug)}?where[parent][like]=${folder.id}&select=id`;
		const [errorFolders, resultfolders] = await trycatch(fetch(urlFolders).then((r) => r.json()));
		if (errorFolders) {
			return toast.error('Error retrieving folder content');
		}

		filesToDeleteCount = resultFiles.docs.length;
		foldersToDeleteCount = resultfolders.docs.length;
		message = t__(
			'common.delete_dialog_text',
			`wich contains ${filesToDeleteCount} documents and ${foldersToDeleteCount} folders`
		);
		deleteConfirmOpen = true;
	}

	async function handleDelete() {
		const url = `${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(slug)}/${folder.id}`;
		const [error, result] = await trycatch(fetch(url, { method: 'DELETE' }).then((r) => r.json()));
		if (error) {
			return toast.error('Error deleting folder');
		}
		toast.success(t__('delete_success'));
		deleteConfirmOpen = false;
		if (onDelete) {
			onDelete(folder.id);
		}
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault(); // Prevent default browser behavior
    anchorElement?.classList.remove('rz-folder--dragover');
    
		// Get the document ID from dataTransfer
		const docId = e.dataTransfer?.getData('text/plain');
		if (!docId) return;

		const updatePathUrl = `${env.PUBLIC_RIZOM_URL}/api/${slug}/${docId}`;
		const [error, repsonse] = await trycatch(
			fetch(updatePathUrl, {
				method: 'PATCH',
				body: JSON.stringify({ _path: folder.id })
			}).then((r) => r.json())
		);

		if (error) {
			return toast.error('Error moving document');
		}

		toast.success('Document moved successfully');
		if (onMoveInside) {
			onMoveInside({ documentId: docId, path: folder.id });
		}
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		anchorElement?.classList.add('rz-folder--dragover');
	}

	function handleDragLeave() {
		anchorElement?.classList.remove('rz-folder--dragover');
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

<a
	bind:this={anchorElement}
	href="{env.PUBLIC_RIZOM_URL}/panel/{slug}?{PARAMS.UPLOAD_PATH}={folder.id}"
	class="rz-folder"
	ondragleave={handleDragLeave}
	ondragover={handleDragEnter}
	ondrop={handleDrop}
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
</a>

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
	.rz-folder {
		width: 100%;
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
				fill: hsl(var(--rz-ground-2));
			}
			path:last-child {
				fill: hsl(var(--rz-ground-3));
			}
		}
		:global {
			&.rz-folder--dragover {
				background-color: hsl(var(--rz-ground-4) / 0.7);
			}
		}
	}

	.rz-folder:hover {
		background-color: hsl(var(--rz-ground-4) / 0.7);
	}
</style>
