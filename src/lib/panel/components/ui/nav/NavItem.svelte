<script lang="ts">
	import { page } from '$app/stores';
	import File from 'lucide-svelte/icons/file';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import * as Tooltip from '$lib/panel/components/ui/tooltip';
	import NavItemButton from './NavItemButton.svelte';
	import NavItemButtonCaret from './NavItemButtonCaret.svelte';
	import type { Route } from 'rizom/types/panel';

	type Props = {
		isCollapsed: boolean;
		route: Route;
		[x: string]: any;
	};
	const { isCollapsed, route, ...rest }: Props = $props();

	const { config } = getConfigContext();

	const RouteIcon = config.icons[route.icon] || File;

	let pathname = $page.url.pathname;

	let active = $derived.by(() => {
		const reg = new RegExp(`^${route.path}(/.*)?$`);
		return reg.test(pathname);
	});
</script>

{#if isCollapsed}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<NavItemButton icon={RouteIcon} {active} {...rest} {...props} />
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="right">
				{route.title}
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{:else}
	<NavItemButton icon={RouteIcon} {active} {...rest}>
		{#if active}
			<NavItemButtonCaret />
		{/if}
		{route.title}
	</NavItemButton>
{/if}
