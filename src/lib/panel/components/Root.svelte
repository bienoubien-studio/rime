<script lang="ts">
	import Nav from '$lib/panel/components/ui/nav/Nav.svelte';
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import { onMount, type Snippet } from 'svelte';
	import createContext from '$lib/panel/context/createContext.svelte';
	import { page } from '$app/state';
	import { setConfigContext } from '$lib/panel/context/config.svelte';
	import { setLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { setUserContext } from '$lib/panel/context/user.svelte.js';
	import type { User, Route, BrowserConfig } from 'rizom/types';

	type Props = {
		routes: Record<string, Route[]>;
		children: Snippet;
		locale: string | undefined;
		config: BrowserConfig;
		user: User;
	};
	const { config, routes, children, locale: initialeLocale, user }: Props = $props();

	let isCollapsed = $state(false);
	let localeCollapsed = $state<string | null>(null);
	
	setConfigContext(config);
	setUserContext(user);
	createContext('title', '[untitled]');

	const locale = setLocaleContext(initialeLocale);

	$effect(() => {
		locale.code = initialeLocale;
	});

	function onResize() {
		if (window.innerWidth < 1024 ) {
			isCollapsed = true;
		} else {
			if (!localeCollapsed || localeCollapsed === 'false') {
				isCollapsed = false;
				localeCollapsed === 'false'
			}
		}
	}
	
	$effect(() => {
		onResize();
	});

	const setCollapsed = (bool: boolean) => {
		isCollapsed = bool;
		localeCollapsed = bool.toString();
		localStorage.setItem('rz-panel-collapsed', bool.toString());
	};

	onMount(() => {
		localeCollapsed = localStorage.getItem('rz-panel-collapsed')
		if(localeCollapsed) {
			setCollapsed(localeCollapsed === 'true');
		}
	});
</script>

<svelte:window on:resize={onResize} />

<Toaster />


<div class="rz-panel-root">
	{#key page.url.pathname + locale.code}
		<Nav setCollapsed={setCollapsed} {routes} {isCollapsed} />
		<div class="rz-panel-root__right" class:rz-panel-root__right--navCollapsed={isCollapsed}>
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
		margin-left: var(--rz-size-72);
	}
	
	.rz-panel-root__right--navCollapsed {
		margin-left: var(--rz-size-20);
	}
</style>
