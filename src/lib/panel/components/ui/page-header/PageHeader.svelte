<script lang="ts">
	import { getContext } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import Button from '../button/button.svelte';
	import LanguageSwitcher from '../language-switcher/LanguageSwitcher.svelte';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import SpinLoader from '../../ui/spin-loader/SpinLoader.svelte';
	import { PanelsTopLeft } from 'lucide-svelte';

	import { page } from '$app/stores';
	import type { BuiltDocConfig, BuiltGlobalConfig } from 'rizom/types/config';

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
	const { form, panelURL, class: className, onClose, liveEditing, config }: Props = $props();

	const onCloseIsDefined = !!onClose;
	const title = getContext<{ value: string }>('title');
	//
</script>

<div class:page-header--live={form.isLive} class="rz-page-header {className}">
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
		{#if config.url && !liveEditing}
			<Button target="_blank" href={config.url(form.doc)} variant="secondary">View page</Button>
		{/if}

		{#if config.live && !liveEditing}
			<Button target="_blank" href={config.live(form.doc)} variant="secondary">Live edit</Button>
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
</div>

<style type="postcss" global>
	.rz-page-header {
		position: sticky;
		left: 0;
		right: 0;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--rz-size-4);
		height: var(--rz-size-16);
		border-bottom: var(--rz-border);
		/* background-color: hsl(var(--rz-color-bg) / 0.8); */
		backdrop-filter: blur(8px);
		@mixin px var(--rz-size-8);
	}

	.rz-page-header.page-header--live {
		@mixin px var(--rz-size-5);
	}

	.rz-page-header__left {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
	}
	.rz-page-header__right {
		display: flex;
		align-items: center;
		gap: var(--rz-size-2);
	}
	.rz-page-header__title {
		word-break: break-all;
		@mixin line-clamp 1;
		@mixin font-bold;
	}
	.rz-page-header__close {
		pointer-events: none;
	}
</style>
