<script lang="ts">
	import { getContext } from 'svelte';
	import LanguageSwitcher from '../../ui/language-switcher/LanguageSwitcher.svelte';
	import { Button } from '../../ui/button';
	import { X, PencilRuler, Eye } from '@lucide/svelte';
	import PageHeader from '../../ui/page-header/PageHeader.svelte';
	import { t__ } from '$lib/i18n/index.js';
	import ButtonSave from './ButtonSave.svelte';
	import ButtonStatus from './ButtonStatus.svelte';
	import type { CompiledCollection, CompiledArea } from '$lib/types/config';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { invalidateAll } from '$app/navigation';
	
	// Props
	type Props = {
		onClose?: any;
		class?: string;
		form: DocumentFormContext;
		config: CompiledArea | CompiledCollection;
		collectionUrl?: string;
	};
	const { form, onClose, config }: Props = $props();
	
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
		{#if config.type === 'collection' && config.status}
			<ButtonStatus statusList={config.status} {form} />
		{/if}
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

		<ButtonSave disabled={!form.canSubmit} processing={form.processing} />

		<LanguageSwitcher
			onLocalClick={(code) => {
				invalidateAll();
			}}
		/>
		
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
