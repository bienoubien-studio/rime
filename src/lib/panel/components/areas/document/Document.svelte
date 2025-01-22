<script lang="ts">
	import { getContext } from 'svelte';
	import * as DocUpload from '$lib/panel/components/ui/doc-upload';
	import AuthHeader from './AuthHeader.svelte';
	import RenderFields from '../../fields/RenderFields.svelte';
	import Header from './Header.svelte';
	import { setDocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import ScrollArea from '../../ui/scroll-area/scroll-area.svelte';
	import { isAuthConfig, isUploadConfig } from '$lib/config/utils.js';
	import { getLocaleContext } from 'rizom/panel/context/locale.svelte';
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import type { GenericDoc } from 'rizom/types/doc';
	import CurrentlyEditing from './CurrentlyEditing.svelte';
	import { getUserContext } from 'rizom/panel/context/user.svelte';
	import { beforeNavigate } from '$app/navigation';

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

	function buildPanelURL() {
		// Start with the base URI for the panel
		let panelUri = `/panel/${config.slug}`;

		// Add the item ID to the URI if we're updating a collection doc
		if (operation === 'update' && initial._prototype === 'collection' && initial.id) {
			panelUri += `/${initial.id}`;
		}
		return panelUri;
	}

	function buildPanelActionUrl() {
		// Start with the base URI for the panel
		let panelUri = `/panel/${config.slug}`;

		// Add the item ID to the URI if we're updating a collection doc
		if (operation === 'update' && initial._prototype === 'collection' && initial.id) {
			panelUri += `/${initial.id}`;
		}

		// Determine the appropriate action based on whether we're creating or updating
		let actionSuffix;
		if (operation === 'create') {
			actionSuffix = '/create?/create';
		} else {
			actionSuffix = '?/update';
		}

		// Add a redirect parameter if we're in a nested form ex: relation creation
		const redirectParam = nestedLevel > 0 ? '&redirect=0' : '';

		// Combine all parts to form the final action URL
		return `${panelUri}${actionSuffix}${redirectParam}`;
	}

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
	action={buildPanelActionUrl()}
	enctype="multipart/form-data"
	method="post"
>
	<ScrollArea>
		{#if form.doc._editedBy && form.doc._editedBy.email !== user.attributes.email}
			<CurrentlyEditing email={form.doc._editedBy.email} />
		{/if}
		<Header panelURL={buildPanelURL()} {liveEditing} {form} {config} {onClose}></Header>

		<div class="rz-document__fields">
			{#if config.type === 'collection' && isUploadConfig(config)}
				<DocUpload.Header accept={config.accept} create={operation === 'create'} {form} />
			{/if}
			{#if config.type === 'collection' && isAuthConfig(config) && operation === 'create'}
				<AuthHeader create={operation === 'create'} {form} />
			{/if}
			<RenderFields fields={config.fields} {form} />
		</div>

		<div class="rz-document__infos">
			{#if form.doc.createdAt}
				{@render meta('Created', locale.dateFormat(form.doc.createdAt))}
			{/if}
			{#if form.doc.updatedAt}
				{@render meta('Last update', locale.dateFormat(form.doc.updatedAt))}
			{/if}
			{#if form.doc.id}
				{@render meta('id', form.doc.id)}
			{/if}
		</div>
	</ScrollArea>
</form>

<style type="postcss">
	.rz-document {
		min-height: 100vh;
		& :global(.rz-scroll-area) {
			height: 100vh;
		}
	}
	.rz-document__fields {
		@mixin px var(--rz-size-8);
		display: grid;
		gap: var(--rz-size-4);
		padding-bottom: var(--rz-size-6);
		padding-top: var(--rz-size-8);
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
