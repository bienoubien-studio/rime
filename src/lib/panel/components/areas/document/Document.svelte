<script lang="ts">
	import { getContext } from 'svelte';
	import UploadHeader from './upload-header/UploadHeader.svelte';
	import AuthHeader from './AuthHeader.svelte';
	import RenderFields from '../../fields/RenderFields.svelte';
	import Header from './Header.svelte';
	import { setDocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import ScrollArea from '../../ui/scroll-area/scroll-area.svelte';
	import { isAuthConfig, isUploadConfig } from '$lib/config/utils.js';
	import { getLocaleContext } from 'rizom/panel/context/locale.svelte';
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import type { GenericDoc } from 'rizom/types/doc';
	import CurrentlyEdited from './CurrentlyEdited.svelte';
	import { getUserContext } from 'rizom/panel/context/user.svelte';
	import { beforeNavigate } from '$app/navigation';
	import FloatingUI from './FloatingUI.svelte';
	import { t__ } from 'rizom/panel/i18n';

	type Props = {
		doc: GenericDoc;
		operation: 'update' | 'create';
		class?: string;
		onDataChange?: any;
		onFieldFocus?: any;
		readOnly: boolean;
		onClose?: any;
		nestedLevel?: number;
		onNestedDocumentCreated?: any;
	};

	const {
		doc: initial,
		operation,
		readOnly,
		onClose,
		onNestedDocumentCreated,
		nestedLevel = 0,
		onDataChange = null,
		onFieldFocus = null,
		class: className
	}: Props = $props();

	const { getDocumentConfig } = getConfigContext();
	const config = getDocumentConfig({
		prototype: initial._prototype,
		slug: initial._type
	});
	const user = getUserContext();
	const title = getContext<{ value: string }>('title');
	let formElement: HTMLFormElement;

	beforeNavigate(async () => {
		// if (
		// 	operation === 'update' &&
		// 	form.doc._editedBy.length &&
		// 	form.doc._editedBy[0].id === user.attributes.id
		// ) {
		// 	// console.log('untake control');
		// 	await fetch(`/api/${config.slug}/${initial.id}`, {
		// 		method: 'PATCH',
		// 		body: JSON.stringify({
		// 			_editedBy: []
		// 		})
		// 	});
		// }
	});

	const form = setDocumentFormContext({
		initial,
		config,
		readOnly,
		onNestedDocumentCreated,
		onDataChange,
		onFieldFocus,
		key: `${initial._type}.${nestedLevel}`
	});

	const locale = getLocaleContext();
	const liveEditing = !!onDataChange;

	$effect(() => {
		title.value = form.title;
	});

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (form.canSubmit) formElement.requestSubmit();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#snippet meta(label: string, value: string)}
	<p class="rz-document__metas">
		<span>{label} : </span>
		{value}
	</p>
{/snippet}

<form
	class="rz-document {className}"
	bind:this={formElement}
	use:form.enhance
	action={form.buildPanelActionUrl()}
	enctype="multipart/form-data"
	method="post"
>
	<ScrollArea>
		{#if form.doc._editedBy && form.doc._editedBy !== user.attributes.id}
			<CurrentlyEdited by={form.doc._editedBy} doc={form.doc} user={user.attributes} />
		{/if}

		{#if !liveEditing}
			<Header {form} {config} {onClose}></Header>
		{:else}
			<FloatingUI {form} {onClose} />
		{/if}

		<div class="rz-document__fields">
			{#if config.type === 'collection' && isUploadConfig(config)}
				<UploadHeader accept={config.accept} create={operation === 'create'} {form} />
			{/if}
			{#if config.type === 'collection' && isAuthConfig(config) && operation === 'create'}
				<AuthHeader create={operation === 'create'} {form} />
			{/if}
			<RenderFields fields={config.fields} {form} />
		</div>

		<div class="rz-document__infos">
			{#if form.doc.createdAt}
				{@render meta(t__('common.created_at'), locale.dateFormat(form.doc.createdAt))}
			{/if}
			{#if form.doc.updatedAt}
				{@render meta(t__('common.last_update'), locale.dateFormat(form.doc.updatedAt))}
			{/if}
			{#if form.doc.id}
				{@render meta('id', form.doc.id)}
			{/if}
		</div>
	</ScrollArea>
</form>

<style type="postcss">
	.rz-document {
		container: rz-document / inline-size;
		background-color: hsl(var(--rz-ground-7));
		min-height: 100vh;
		position: relative;
		& :global(.rz-scroll-area) {
			height: 100vh;
		}
		> :global(.rz-scroll-area) {
			--rz-fields-padding: var(--rz-size-6);
			@container rz-document (min-width:640px) {
				--rz-fields-padding: var(--rz-size-8);
			}
		}
	}
	.rz-document__fields {
		/* @mixin px var(--rz-size-8); */
		display: grid;
		gap: var(--rz-size-4);
		padding-bottom: var(--rz-size-6);
		&:not(:has(> .rz-render-fields > .rz-render-fields__field[data-type='tabs'])) {
			padding-top: var(--rz-size-8);
		}
	}
	.rz-document__infos {
		border-top: var(--rz-border);
		@mixin px var(--rz-size-8);
		@mixin py var(--rz-size-6);
	}
	.rz-document__metas {
		@mixin mx var(--rz-size-4);
		font-size: var(--rz-text-xs);
	}
	.rz-document__metas span {
		@mixin font-semibold;
	}
</style>
