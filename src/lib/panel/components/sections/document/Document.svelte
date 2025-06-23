<script lang="ts">
	import { getContext } from 'svelte';
	import UploadHeader from './upload-header/UploadHeader.svelte';
	import RenderFields from '../../fields/RenderFields.svelte';
	import Header from './Header.svelte';
	import { setDocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { isAuthConfig, isUploadConfig } from '$lib/util/config.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import CurrentlyEdited from './CurrentlyEdited.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { beforeNavigate } from '$app/navigation';
	import FloatingUI from './FloatingUI.svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import AuthFooter from './AuthFooter.svelte';
	import type { GenericDoc } from '$lib/core/types/doc';

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
	let formElement = $state<HTMLFormElement>();
	
	beforeNavigate(async () => {
		// if (
		// 	operation === 'update' &&
		// 	form.doc.editedBy.length &&
		// 	form.doc.editedBy[0].id === user.attributes.id
		// ) {
		// 	await fetch(`/api/${config.slug}/${initial.id}`, {
		// 		method: 'PATCH',
		// 		body: JSON.stringify({
		// 			editedBy: []
		// 		})
		// 	});
		// }
	});

	const form = setDocumentFormContext({
		element: () => formElement,
		initial,
		config,
		readOnly,
		onNestedDocumentCreated,
		onDataChange,
		onFieldFocus,
		key: `${initial._type}_${nestedLevel}`
	});

	const locale = getLocaleContext();
	const liveEditing = !!onDataChange;

	$effect(() => {
		title.value = form.title;
	});

	function handleKeyDown(event: KeyboardEvent) {
		if(!formElement) throw Error('formElement is not defined')
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (!form.canSubmit) return;
			const saveButton = formElement.querySelector('button[data-submit]');
			if (saveButton) {
				formElement.requestSubmit(saveButton as HTMLButtonElement);
			} else {
				// Fallback to default submit if no specific button found
				formElement.requestSubmit();
			}
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
	{#if !liveEditing}
		<Header {form} {config} {onClose}></Header>
	{/if}

	{#if form.doc.editedBy && form.doc.editedBy !== user.attributes.id}
		<CurrentlyEdited by={form.doc.editedBy} doc={form.doc} user={user.attributes} />
	{/if}

	<div class="rz-document__fields">
		{#if config.type === 'collection' && isUploadConfig(config)}
			<UploadHeader accept={config.upload.accept} create={operation === 'create'} {form} />
		{/if}
		<RenderFields fields={config.fields} {form} />
		{#if config.type === 'collection' && isAuthConfig(config)}
			<AuthFooter {operation} {form} />
		{/if}
	</div>

	{#if !form.isLive}
		<div class="rz-document__infos">
			{#if form.doc.createdAt}
				{@render meta(t__('common.created_at'), locale.dateFormat(form.doc.createdAt))}
			{/if}
			{#if form.doc.updatedAt}
				{@render meta(t__('common.last_update'), locale.dateFormat(form.doc.updatedAt))}
			{/if}
			{#if form.doc.editedBy}
				{@render meta(t__('common.edited_by'), locale.dateFormat(form.doc.editedBy))}
			{/if}
			{#if form.doc.id}
				{@render meta('id', form.doc.id)}
			{/if}
		</div>
	{:else}
		<FloatingUI {form} {onClose} />
	{/if}
</form>

<style type="postcss">
	.rz-document {
		container: rz-document / inline-size;
		min-height: 100vh;
		position: relative;
	}
	.rz-document__fields {
		display: grid;
		gap: var(--rz-size-4);
		min-height: calc(100vh - var(--rz-size-14));
		align-content: flex-start;
		margin-left: calc(-1 * var(--rz-fields-padding));
		margin-right: calc(-1 * var(--rz-fields-padding));
		padding: var(--rz-size-5) var(--rz-page-gutter);
	}
	.rz-document__infos {
		border-top: var(--rz-border);
		@mixin px var(--rz-page-gutter);
		@mixin py var(--rz-size-6);
	}
	.rz-document__metas {
		font-size: var(--rz-text-xs);
	}
	.rz-document__metas span {
		@mixin font-semibold;
	}
</style>
