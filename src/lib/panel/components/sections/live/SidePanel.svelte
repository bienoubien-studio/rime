<script lang="ts">
	import Document from '../document/Document.svelte';
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import createContext from '$lib/panel/context/createContext.svelte.js';
	import { setConfigContext } from '$lib/panel/context/config.svelte.js';
	import { setLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { setUserContext } from '$lib/panel/context/user.svelte.js';
	import type { User } from '$lib/core/collections/auth/types.js';
	import type { BrowserConfig } from '$lib/core/config/types/index.js';
	import { setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte.js';
	import { goto } from '$app/navigation';
	import ScrollArea from '../../ui/scroll-area/scroll-area.svelte';

	type Props = {
		doc: any;
		locale: string | undefined;
		config: BrowserConfig;
		onDataChange: any;
		onFieldFocus: any;
		user: User;
	};

	const { doc, config, locale: initialeLocale, user, onDataChange, onFieldFocus }: Props = $props();

	function buildPanelURL() {
		// Start with the base URI for the panel
		let panelUri = `/panel/${doc._type}`;

		// Add the item ID to the URI if we're updating a collection doc
		if (doc._prototype === 'collection' && doc.id) {
			panelUri += `/${doc.id}`;
		}
		return panelUri;
	}

	setAPIProxyContext('document');
	setConfigContext(config);
	setUserContext(user);
	createContext('title', '[untitled]');
	const locale = setLocaleContext(initialeLocale);

	$effect(() => {
		locale.code = initialeLocale;
	});
</script>

<Toaster />

<ScrollArea class="rz-live-panel">
	<Document
		onClose={() => goto(buildPanelURL())}
		{onDataChange}
		{onFieldFocus}
		{doc}
		readOnly={false}
		operation="update"
	/>
</ScrollArea>

<style>
	:global {
		.rz-live-panel .rz-scroll-area {
			--rz-page-gutter: var(--rz-size-4);
			--rz-tabs-list-top: 0;
			height: 100vh;
			background-color: hsl(var(--rz-ground-5));

			.rz-document__fields:has(.rz-render-fields > .rz-render-fields__field[data-type='tabs']:first-child) {
				padding-top: var(--rz-size-2);
			}
		}
	}
</style>
