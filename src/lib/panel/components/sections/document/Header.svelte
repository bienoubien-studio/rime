<script lang="ts">
	import { getContext } from 'svelte';
	import { Button } from '../../ui/button';
	import { X, PencilRuler, ExternalLink } from '@lucide/svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import ButtonSave from './ButtonSave.svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import type { CompiledCollection, CompiledArea } from '$lib/core/config/types';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import Settings from './Settings.svelte';
	import ButtonStatus from './ButtonStatus.svelte';

	// Props
	type Props = {
		onClose?: any;
		form: DocumentFormContext;
		config: CompiledArea | CompiledCollection;
	};
	const { form, onClose, config }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const titleContext = getContext<{ value: string }>('title');
	const buttonLabel = $derived(form.doc.id ? t__('common.save') : t__('common.create'))
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

		{#if form.doc.id}
			<Settings {form} />
		{/if}

		{#if !form.config.versions}
			<!-- scenario 1: no versions -->
			<ButtonSave size="sm" label={buttonLabel} disabled={!form.canSubmit} processing={form.processing} />
		{:else if form.config.versions && !form.config.versions.draft}
			<!-- scenario 2: versions without draft -->
			<ButtonSave
				size="sm"
				label={buttonLabel}
				disabled={!form.canSubmit}
				processing={form.processing}
				data-draft
				data-submit
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'published'}
			
			{#if form.doc.id}
				<ButtonStatus {form} />
			{/if}

			<!-- scenario 3: versions and draft, on a published doc -->
			<ButtonSave
				size="sm"
				disabled={!form.canSubmit}
				processing={form.processing}
				label={buttonLabel}
				data-status="published"
				data-submit
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'draft'}
			{#if form.doc.id}
				<ButtonStatus {form} />
			{/if}
			<!-- scenario 4: versions and draft, on a draft doc -->

			<!-- PUBLISH -->
			<ButtonSave
				size="sm"
				disabled={form.readOnly}
				processing={form.processing}
				label={buttonLabel}
				data-submit
			/>
		{/if}
	{/snippet}

	{#snippet topRight()}
		<LanguageSwitcher onLocalClick={invalidateAll} />
	{/snippet}
	
</PageHeader>
