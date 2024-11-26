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

	setConfigContext(config);
	setUserContext(user);
	createContext('title', '[undefined]');
	const locale = setLocaleContext(initialeLocale);

	$effect(() => {
		locale.code = initialeLocale;
	});
</script>

<Toaster />
<Document {onDataChange} {onFieldFocus} {doc} readOnly={false} operation="update" />
