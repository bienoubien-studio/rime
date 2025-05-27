<script lang="ts">
	import { getContext } from 'svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import { Button } from '../../ui/button';
	import { X, PencilRuler, Eye, History } from '@lucide/svelte';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import ButtonSave from './ButtonSave.svelte';
	import type { CompiledCollection, CompiledArea } from '$lib/core/config/types';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';

	// Props
	type Props = {
		onClose?: any;
		form: DocumentFormContext;
		config: CompiledArea | CompiledCollection;
		isEditingVersion?: boolean;
	};
	const { form, onClose, config, isEditingVersion = false }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const title = getContext<{ value: string }>('title');
</script>

<PageHeader>
	<div class:rz-page-header__left--with-close={onCloseIsDefined} class="rz-page-header__left">
		{#if onCloseIsDefined}
			<Button onclick={onClose} variant="ghost" size="icon-sm">
				<X class="rz-page-header__close" size="17" />
			</Button>
		{/if}
		<h1 class="rz-page-header__title">
			{title.value}
		</h1>
		<!-- {#if config.type === 'collection' && config.status}
			<ButtonStatus statusList={config.status} {form} />
		{/if} -->
	</div>

	<div class="rz-page-header__right">
		{#if config.url && form.doc.url}
			<Button icon={Eye} target="_blank" href={form.doc.url} variant="text">
				{t__('common.view_page')}
			</Button>
		{/if}

		{#if config.live && form.doc._live}
			<Button
				disabled={form.readOnly}
				class="rz-button-live"
				icon={PencilRuler}
				href={form.doc._live}
				variant="text"
			>
				Live edit
			</Button>
		{/if}

		{#if !form.config.versions}
			<!-- scenario 1: no versions -->
			<ButtonSave
				label={t__('common.save')}
				disabled={!form.canSubmit}
				processing={form.processing}
			/>
		{:else if form.config.versions && !form.config.versions.draft}
			<!-- scenario 2: versions without draft -->
			
			<!-- SAVE -->
			<!-- if we are on /panel/{slug}/{id}/versions add the data-version id to update instead of creating a new version -->
			<!-- data-version : version updated -->
			<!-- no data-version : new version created -->
			<ButtonSave
				label={t__('common.save')}
				disabled={!form.canSubmit}
				processing={form.processing}
				data-version={isEditingVersion ? form.doc.versionId : null}
			/>

			<Button
				onclick={() =>
					goto(`${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}/${form.doc.id}/versions`)}
				variant="outline"
				icon={History}
				size="icon"
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'published'}
			<!-- scenario 3: versions and draft, on a published doc -->
			
			<!-- SAVE NEW DRAFT -->
			<!-- no data-version : new draft created -->
			<!-- data-draft : document as draft -->
			<ButtonSave
				variant="secondary"
				disabled={form.readOnly}
				processing={form.processing}
				label={t__('common.save_new_draft')}
				data-draft
			/>
			
			<!-- PUBLISH -->
			<!-- data-version : current published doc updated -->
			<!-- no data-draft : keep it published -->
			<ButtonSave
				disabled={!form.canSubmit}
				processing={form.processing}
				label={t__('common.save')}
				data-version={form.doc.versionId}
			/>
			
			<Button
				onclick={() =>
					goto(`${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}/${form.doc.id}/versions`)}
				variant="outline"
				icon={History}
				size="icon"
			/>
		{:else if form.config.versions && form.config.versions.draft && form.doc.status === 'draft'}
			<!-- scenario 4: versions and draft, on a draft doc -->
			
			<!-- SAVE DRAFT -->
			<!-- data-version : update the current draft version -->
			<!-- data-draft : update as draft -->
			<ButtonSave
				variant="secondary"
				disabled={!form.canSubmit}
				processing={form.processing}
				label={t__('common.save_draft')}
				data-version={form.doc.versionId}
				data-draft
			/>
			
			<!-- PUBLISH -->
			<!-- data-version : publish the current version -->
			<!-- no data-draft : publish the doc -->
			<ButtonSave
				disabled={form.readOnly}
				processing={form.processing}
				data-version={form.doc.versionId}
				label={t__('common.publish')}
			/>
			
			<Button
				onclick={() =>
					goto(`${env.PUBLIC_RIZOM_URL}/panel/${form.config.slug}/${form.doc.id}/versions`)}
				variant="outline"
				icon={History}
				size="icon"
			/>
		{/if}

		<LanguageSwitcher onLocalClick={invalidateAll} />
	</div>
</PageHeader>

<style type="postcss">
	.rz-page-header__left {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
		margin-left: var(--rz-size-3);
		&.rz-page-header__left--with-close {
			margin-left: 0;
		}
		:global(.rz-button) {
			flex-shrink: 0;
		}
	}
	.rz-page-header__right {
		display: flex;
		align-items: center;
		gap: var(--rz-size-4);
	}
	.rz-page-header__title {
		word-break: break-all;
		@mixin line-clamp 1;
		@mixin font-bold;
	}
</style>
