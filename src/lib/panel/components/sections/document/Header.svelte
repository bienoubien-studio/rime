<script lang="ts">
	import { getContext } from 'svelte';
	import { Button } from '../../ui/button';
	import { X, PencilRuler, History, ExternalLink } from '@lucide/svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import ButtonSave from './ButtonSave.svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import type { CompiledCollection, CompiledArea } from '$lib/core/config/types';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Settings from './Settings.svelte';
	import ButtonStatus from './ButtonStatus.svelte';
	import { page } from '$app/state';
	import { PARAMS } from '$lib/core/constant.js';
	import { doc } from '$lib/util/index.js';

	// Props
	type Props = {
		onClose?: any;
		form: DocumentFormContext;
		config: CompiledArea | CompiledCollection;
	};
	const { form, onClose, config }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const titleContext = getContext<{ value: string }>('title');

	const isVersionPage = $derived(page.url.pathname.includes('/versions'));

	const versionsUrl = $derived.by(() => {
		const isCollection = form.doc._prototype === 'collection';
		const basUrl = isCollection
			? `${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}/${form.doc.id}`
			: `${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}`;
		if (isVersionPage) {
			// Close versions and go to edit the document version
			return `${basUrl}?${PARAMS.VERSION_ID}=${form.doc.versionId}`;
		} else {
			// Go to version page
			return `${basUrl}/versions?${PARAMS.VERSION_ID}=${form.doc.versionId}`;
		}
	});
</script>

{#snippet topLeft()}
	<Button onclick={() => onClose()} icon={X} variant="text">{t__('common.close')}</Button>
{/snippet}

<PageHeader topLeft={onCloseIsDefined ? topLeft : undefined}>
	{#snippet title()}
		{titleContext.value}
	{/snippet}

	{#snippet bottomRight()}
		{#if config.url && form.doc.url}
			<Button icon={ExternalLink} target="_blank" href={form.doc.url} size="icon-sm" variant="secondary" />
		{/if}

		{#if config.live && form.doc._live}
			<Button
				size="icon-sm"
				variant="secondary"
				disabled={form.readOnly}
				class="rz-button-live"
				icon={PencilRuler}
				href={form.doc._live}
			></Button>
		{/if}

		<Settings {form} />

		{#if !form.config.versions}
			<!-- scenario 1: no versions -->
			<ButtonSave size="sm" label={t__('common.save')} disabled={!form.canSubmit} processing={form.processing} />
		{:else if form.config.versions && !form.config.versions.draft}
			<!-- scenario 2: versions without draft -->
			<ButtonSave
				size="sm"
				label={t__('common.save')}
				disabled={!form.canSubmit}
				processing={form.processing}
				data-draft
				data-submit
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'published'}
			<ButtonStatus {form} />
			<!-- scenario 3: versions and draft, on a published doc -->
			<ButtonSave
				size="sm"
				disabled={!form.canSubmit}
				processing={form.processing}
				label={t__('common.save')}
				data-status="published"
				data-submit
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'draft'}
			<ButtonStatus {form} />
			<!-- scenario 4: versions and draft, on a draft doc -->

			<!-- PUBLISH -->
			<ButtonSave
				size="sm"
				disabled={form.readOnly}
				processing={form.processing}
				label={t__('common.save')}
				data-submit
			/>
		{/if}
	{/snippet}
	{#snippet topRight()}
		<LanguageSwitcher onLocalClick={invalidateAll} />
	{/snippet}
</PageHeader>
