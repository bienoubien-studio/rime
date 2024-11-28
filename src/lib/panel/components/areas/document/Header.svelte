<script lang="ts">
	import { getContext } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	// import Button from 'rizom/panel//button/button.svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import { Button } from '../../ui/button';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { PencilRuler, Eye, PanelsTopLeft } from 'lucide-svelte';

	import { page } from '$app/stores';
	import type { BuiltDocConfig, BuiltGlobalConfig } from 'rizom/types/config';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';

	// Props
	type Props = {
		onClose?: any;
		class?: string;
		panelURL: string;
		liveEditing: boolean;
		form: DocumentFormContext;
		config: BuiltGlobalConfig | BuiltDocConfig;
		collectionUrl?: string;
	};
	const { form, panelURL, onClose, liveEditing, config }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const title = getContext<{ value: string }>('title');
	//
</script>

<!-- <div class:page-header--live={form.isLive} class="rz-page-header {className}"> -->
<PageHeader>
	<div class="rz-page-header__left">
		{#if onCloseIsDefined}
			<Button onclick={onClose} variant="ghost" size="icon-sm">
				<X class="rz-page-header__close" size="17" />
			</Button>
		{/if}

		{#if !liveEditing}
			<h1 class="rz-page-header__title">
				{title.value}
			</h1>
		{:else}
			<a href={panelURL}>
				<Button size="icon" variant="default"><PanelsTopLeft size="16" /></Button>
			</a>
		{/if}
	</div>

	<div class="rz-page-header__right">
		{#if config.url && !liveEditing && form.doc._url}
			<Button icon={Eye} target="_blank" href={form.doc._url} variant="text">View page</Button>
		{/if}

		{#if config.live && !liveEditing && form.doc._live}
			<Button class="rz-button-live" icon={PencilRuler} href={form.doc._live} variant="text">
				Live edit
			</Button>
		{/if}

		<Button type="submit" disabled={!form.canSubmit}>
			{#if form.processing}
				<SpinLoader />
			{/if}
			Save
		</Button>

		{#if !liveEditing}
			<LanguageSwitcher />
		{:else}
			<Button href={$page.url.searchParams.get('src')} variant="ghost" size="icon-sm">
				<X class="rz-page-header__close" size="17" />
			</Button>
		{/if}
	</div>
</PageHeader>

<style type="postcss" global>
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
	/* .rz-page-header__close {
		pointer-events: none;
	} */
</style>
