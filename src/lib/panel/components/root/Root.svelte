<script lang="ts">
	import Nav from '$lib/panel/components/ui/nav/Nav.svelte';
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import { type Snippet } from 'svelte';
	import createContext from '$lib/panel/context/createContext.svelte';
	import { page } from '$app/stores';
	import { setConfigContext } from '$lib/panel/context/config.svelte';
	import { setLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { setUserContext } from '$lib/panel/context/user.svelte.js';
	import type { User, Route, BrowserConfig } from 'rizom/types';
	import { registerTranslation } from 'rizom/panel/i18n';

	type Props = {
		routes: Record<string, Route[]>;
		children: Snippet;
		locale: string | undefined;
		config: BrowserConfig;
		user: User;
	};
	const { config, routes, children, locale: initialeLocale, user }: Props = $props();

	let isCollapsed = $state(false);

	setConfigContext(config);
	setUserContext(user);
	createContext('title', '[undefined]');

	const locale = setLocaleContext(initialeLocale);

	$effect(() => {
		locale.code = initialeLocale;
	});

	function onResize() {
		if (window.innerWidth < 1024) {
			isCollapsed = true;
		} else {
			isCollapsed = false;
		}
	}

	$effect(() => {
		onResize();
	});
</script>

<svelte:window on:resize={onResize} />

<Toaster />

<div class="rz-panel-root">
	{#key $page.url.pathname + locale.code}
		<Nav {routes} {isCollapsed} />
		<div class="rz-panel-root__right">
			{@render children()}
		</div>
	{/key}
</div>

<style>
	.rz-panel-root {
		container-type: inline-size;
		container-name: rz-panel;
		font-family: var(--rz-font-sans);
		background-color: hsl(var(--rz-ground-6));
		min-height: 100vh;
	}

	.rz-panel-root__right {
		margin-left: var(--rz-size-20);
	}
	@container rz-panel (min-width:1024px) {
		.rz-panel-root__right {
			margin-left: var(--rz-size-72);
		}
	}
</style>
