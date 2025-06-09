<script lang="ts">
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import * as DropdownMenu from '$lib/panel/components/ui/dropdown-menu/index.js';
	import { History, Pickaxe, Settings, Trash2 } from '@lucide/svelte';
	import { t__ } from '../../../../core/i18n/index.js';
	import { PARAMS, VERSIONS_STATUS } from '$lib/core/constant.js';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { goto } from '$app/navigation';

	type Props = { form: DocumentFormContext };

	const { form }: Props = $props();

	function handleNewDraft() {
		if (form.readOnly || !form.element) return console.log(form.readOnly);
		const saveButton = form.element.querySelector('button[data-submit]') as HTMLButtonElement;
		const initialSaveButtonDataDraft = saveButton.dataset.draft;
		if (saveButton) {
			saveButton.dataset.draft = 'true';
			saveButton.dataset.status = VERSIONS_STATUS.DRAFT;
			form.element.requestSubmit(saveButton as HTMLButtonElement);
		} else {
			// Fallback to default submit if no specific button found
			form.element.requestSubmit();
		}
		saveButton.dataset.draft = initialSaveButtonDataDraft;
	}

	const isVersionPage = $derived(page.url.pathname.includes('/versions'));

	function handleViewVersion() {
		const isCollection = form.doc._prototype === 'collection';
		const basUrl = isCollection
			? `${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}/${form.doc.id}`
			: `${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}`;
		return goto(`${basUrl}/versions?${PARAMS.VERSION_ID}=${form.doc.versionId}`);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button icon={Settings} size="icon-sm" variant="secondary" {...props} />
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content class="rz-link__type-content" align="end">
			
			<DropdownMenu.Item disabled={isVersionPage} onclick={() => handleViewVersion()}>
				<History size="12" />
				{t__('common.view_versions')}
			</DropdownMenu.Item>

			<DropdownMenu.Item onclick={() => handleNewDraft()}>
				<Pickaxe size="12" />
				{t__('common.save_new_draft')}
			</DropdownMenu.Item>

			<DropdownMenu.Item onclick={() => 'coucou'}>
				<Trash2 size="12" />
				{t__('common.delete')}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
