<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { directoryInput } from '$lib/core/collections/upload/directory-input-config.js';
	import Input from '$lib/fields/text/component/Text.svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import * as Dialog from '$lib/panel/components/ui/dialog/index.js';
	import type { CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { setFormContext } from '$lib/panel/context/form.svelte.js';
	import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
	import { FolderPlus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { t__ } from '../../../../../core/i18n/index.js';

	type Props = { collection: CollectionContext };
	const { collection }: Props = $props();

	const createFolderForm = setFormContext({ name: '' }, 'new-folder');
	let dialogOpen = $state(false);
	const field = createFolderForm.useField('name', directoryInput);

	async function handleFolderCreation() {
		const url = `${env.PUBLIC_RIZOM_URL}/api/${makeUploadDirectoriesSlug(collection.config.slug)}`;
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				id: `${collection.upload.currentPath}:${field.value}`
			})
		});

		if (response.status === 200) {
			const { doc } = await response.json();
			toast.success(t__('common.directory_created'));
			collection.upload.directories.push(doc);
			dialogOpen = false;
		} else if (response.status === 400) {
			let { message } = await response.json();
			if (message === 'errors.unique_field') {
				message = 'errors.folder_already_exists';
			}
			createFolderForm.errors.set('name', message);
		} else {
			toast.error(t__('errors.unknown_error'));
			dialogOpen = false;
		}
	}
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger>
		{#snippet child(props)}
			<Button
				disabled={collection.selectMode}
				onclick={() => (dialogOpen = true)}
				size="icon-sm"
				variant="ghost"
				{...props}
			>
				<FolderPlus size={17} />
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="rz-status-dialog">
		<Dialog.Header>{t__('common.create_folder')}</Dialog.Header>
		<Input form={createFolderForm} config={directoryInput} />
		<Dialog.Footer --rz-justify-content="space-between">
			<Button disabled={!createFolderForm.canSubmit} onclick={handleFolderCreation}>Validate</Button>
			<Button variant="secondary" onclick={() => (dialogOpen = false)}>Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
