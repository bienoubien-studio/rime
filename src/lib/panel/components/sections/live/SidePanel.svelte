<script lang="ts">
	import Document from '../document/Document.svelte';
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import createContext from '$lib/panel/context/createContext.svelte';
	import { setConfigContext } from '$lib/panel/context/config.svelte';
	import { setLocaleContext } from '$lib/panel/context/locale.svelte';
	import { setUserContext } from '$lib/panel/context/user.svelte';
	import type { User } from 'rizom/types/auth';
	import type { PrototypeSlug } from 'rizom/types/doc';
	import type { BrowserConfig } from 'rizom/types/config';
	import { goto } from '$app/navigation';
	import { setAPIProxyContext } from 'rizom/panel/context/api-proxy.svelte.js';

	type Props = {
		doc: any;
		slug: PrototypeSlug;
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
<Document
	onClose={() => goto(buildPanelURL())}
	{onDataChange}
	{onFieldFocus}
	{doc}
	readOnly={false}
	operation="update"
/>
