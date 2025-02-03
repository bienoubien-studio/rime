<script lang="ts">
	import { getContext } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import { Button } from '../../ui/button';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { PencilRuler, Eye } from 'lucide-svelte';
	import type { CompiledCollectionConfig, CompiledGlobalConfig } from 'rizom/types/config';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import { __t } from 'rizom/panel/i18n';

	// Props
	type Props = {
		onClose?: any;
		class?: string;
		form: DocumentFormContext;
		config: CompiledGlobalConfig | CompiledCollectionConfig;
		collectionUrl?: string;
	};
	const { form, onClose, config }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const title = getContext<{ value: string }>('title');
</script>

<PageHeader>
	<div class="rz-page-header__left">
		{#if onCloseIsDefined}
			<Button onclick={onClose} variant="ghost" size="icon-sm">
				<X class="rz-page-header__close" size="17" />
			</Button>
		{/if}
		<h1 class="rz-page-header__title">
			{title.value}
		</h1>
	</div>

	<div class="rz-page-header__right">
		{#if config.url && form.doc._url}
			<Button icon={Eye} target="_blank" href={form.doc._url} variant="text">
				{__t('common.view_page')}
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

		<Button type="submit" disabled={!form.canSubmit}>
			{#if form.processing}
				<SpinLoader />
			{/if}
			{__t('common.save')}
		</Button>

		<LanguageSwitcher />
	</div>
</PageHeader>

<style type="postcss">
	.rz-page-header__left {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
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
