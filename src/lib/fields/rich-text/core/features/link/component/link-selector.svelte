<script lang="ts">
	import { apiUrl } from '$lib/core/api';
	import { t__ } from '$lib/core/i18n/index.js';
	import IconButton from '$lib/fields/rich-text/component/bubble-menu/icon-button/icon-button.svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import Input from '$lib/panel/components/ui/input/input.svelte';
	import { API_PROXY, getAPIProxyContext, type Resource } from '$lib/panel/context/api-proxy.svelte';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { url as validateURL } from '$lib/util/validate.js';
	import { CornerDownLeft, ExternalLink, Link2, Newspaper, Trash } from '@lucide/svelte';
	import type { Editor } from '@tiptap/core';
	import type { LinkFeatureOptions } from '..';
	import type { RichTextContext } from '../../../types';
	import './link-selector.css';

	type Props = { options?: LinkFeatureOptions; editor: Editor; context: RichTextContext; active: boolean };
	type LinkResource = { title: string; url: string };
	let { options, editor, context, active }: Props = $props();

	let value = $state((editor && editor.getAttributes('link').href) || '');
	let error = $state(false);
	let resourceDialogOpen = $state(false);
	let open = $state(false);
	let isTargetBlank = $state(false);

	const APIProxy = getAPIProxyContext(API_PROXY.DOCUMENT);
	const locale = getLocaleContext();
	let resources = $state<Resource<LinkResource[]>[]>([]);
	let resourcesFlatMap = $state<LinkResource[]>();
	$effect(() => {
		if (Array.isArray(options?.resources) && !resources.length) {
			resources = options.resources.map((resourceOption) => {
				let params = resourceOption.query ? `?${resourceOption.query}&select=title,url` : '?select=title,url';
				params = locale.code ? `${params}&locale=${locale.code}` : params;
				const url = `${apiUrl(resourceOption.slug)}${params}`;
				return APIProxy.getRessource<LinkResource[]>(url, {
					transformData: (data) => {
						return 'docs' in data ? data.docs : 'doc' in data ? [data.doc] : data;
					}
				});
			});
		}
	});

	$effect(() => {
		const notNull = (d: LinkResource[] | null): d is LinkResource[] => d !== null;
		resourcesFlatMap = resources
			.map((r) => r.data)
			.filter(notNull)
			.flatMap((r) => r)
			.filter((r) => !!r.url);
	});

	$effect(() => {
		if (open) {
			value = (editor && editor.getAttributes('link').href) || '';
		}
	});

	$effect(() => {
		if (!context.bubbleOpen) {
			open = false;
		}
	});

	let urlState = $derived.by(() => {
		let transformedUrl = value;
		// Add https:// if needed
		if (value && !value.includes('http')) {
			transformedUrl = `https://${value}`;
		}
		return {
			url: transformedUrl,
			isValid: validateURL(transformedUrl) === true
		};
	});

	function onSubmit(event?: SubmitEvent) {
		event && event.preventDefault();
		if (!urlState.isValid) return (error = true);
		editor
			.chain()
			.focus()
			.setLink({ href: urlState.url, target: isTargetBlank ? '_blank' : '_self' })
			.run();
		open = false;
	}

	$effect(() => {
		if (urlState.isValid) {
			editor
				.chain()
				.focus()
				.setLink({ href: urlState.url, target: isTargetBlank ? '_blank' : '_self' })
				.run();
		}
	});

	function onDelete() {
		editor.chain().focus().unsetLink().run();
		value = '';
		open = false;
	}
</script>

<div class="rz-link-selector">
	<IconButton icon={Link2} {active} onclick={() => (open = !open)} />

	{#if open}
		<form onsubmit={onSubmit} class="rz-link-selector__form">
			<Input
				oninput={() => {
					if (error && urlState.isValid) error = false;
				}}
				data-error={error || null}
				placeholder="https://"
				bind:value
			/>

			<div class="rz-link-selector__button">
				{#if editor.getAttributes('link').href}
					<Button
						--rz-button-ghost-fg={isTargetBlank ? 'hsl(var(--rz-color-spot))' : 'hsl(var(--rz-color-fg))'}
						onclick={() => (isTargetBlank = !isTargetBlank)}
						variant="ghost"
						size="icon-sm"
						icon={ExternalLink}
					/>
					<Button size="icon-sm" variant="ghost" icon={Trash} onclick={onDelete} />
				{:else}
					{#if options?.resources.length}
						<Button onclick={() => (resourceDialogOpen = true)} size="icon-sm" icon={Newspaper} variant="ghost" />
					{/if}
					<Button type="submit" variant="ghost" size="icon-sm" icon={CornerDownLeft}></Button>
				{/if}
			</div>
		</form>
	{/if}
</div>

<Command.Dialog bind:open={resourceDialogOpen}>
	<Command.Input placeholder={t__('common.search')} />

	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{#if Array.isArray(resourcesFlatMap)}
			{#each resourcesFlatMap as item, index (index)}
				{#if item}
					<Command.Item
						onSelect={() => {
							value = item.url;
							resourceDialogOpen = false;
							onSubmit();
						}}
						value={item.title}
					>
						<div>
							<p>
								{item.title}
							</p>
						</div>
					</Command.Item>
				{/if}
			{/each}
		{/if}
	</Command.List>
</Command.Dialog>

<style>
	.rz-link-selector {
		position: relative;

		:global(.rz-input) {
			font-size: var(--rz-text-sm);
			border-radius: var(--rz-radius-lg);
		}

		:global(.rz-link-selector__button) {
			position: absolute;
			right: var(--rz-size-1);
			top: var(--rz-size-1-5);
			display: flex;
			align-items: center;
		}
	}

	.rz-link-selector__form {
		position: absolute;
		top: 110%;
		z-index: 100;
		margin-top: var(--rz-size-1);
		display: flex;
		width: 18rem;
		box-shadow: var(--rz-shadow-xl);
		animation: fadeInSlideFromTop 0.2s ease-out;
		border-radius: var(--rz-radius-lg);
	}

	@keyframes fadeInSlideFromTop {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
