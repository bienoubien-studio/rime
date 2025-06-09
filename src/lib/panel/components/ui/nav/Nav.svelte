<script lang="ts">
	import NavItem from './NavItem.svelte';
	import NavGroup from './NavGroup.svelte';
	import UserButton from './UserButton.svelte';
	import type { Route } from '$lib/panel/types';
	import { PanelsTopLeft } from '@lucide/svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import ScrollArea from '../scroll-area/scroll-area.svelte';

	type Props = {
		isCollapsed: boolean;
		setCollapsed: (value: boolean) => void;
		routes: Record<string, Route[]>;
	};
	const { isCollapsed, setCollapsed, routes: routesGroups }: Props = $props();

	const config = getConfigContext();
	const navigationGroupsConfig = config.raw.panel.navigation?.groups;

	const getGroupIcon = (groupName: string) => {
		if (!navigationGroupsConfig) return null;
		const group = navigationGroupsConfig.find((group) => group.label === groupName);
		if (group) {
			return group.icon;
		}
		return null;
	};

	const dashBoardRoute: Route = {
		title: 'Dashboard',
		path: '/panel',
		icon: PanelsTopLeft
	};
</script>

<div class:rz-nav--collapsed={isCollapsed} class="rz-nav">
	<div class="rz-nav__content">
		<div class="rz-nav__header" class:rz-nav__header--collapsed={isCollapsed}>
			<NavItem href="/panel" {isCollapsed} route={dashBoardRoute} />
		</div>

		<div class="rz-nav__body">
			<ScrollArea>
			<nav class="rz-nav__nav">
					{#each Object.entries(routesGroups) as [groupName, routes], index (index)}
						{#if groupName !== 'none'}
							{@const icon = getGroupIcon(groupName)}
							<NavGroup name={groupName} {icon} navCollapsed={isCollapsed}>
								{#each routes as route (route.path)}
									<NavItem href={route.path} {isCollapsed} {route} />
								{/each}
							</NavGroup>
						{/if}
					{/each}
					{#each routesGroups.none as route (route.path)}
						<div class="rz-nav__group-none">
							<NavItem href={route.path} {isCollapsed} {route} />
						</div>
					{/each}
				</nav>
			</ScrollArea>

			<div class="rz-nav__user">
				<UserButton navCollapsed={isCollapsed} />
			</div>
		</div>
	</div>

	<button
		class="rz-nav__toggle"
		onclick={() => setCollapsed(!isCollapsed)}
		aria-label="Toggle navigation"
	>
	</button>
</div>

<style type="postcss">
	.rz-nav {
		position: fixed;
		z-index: 100;
		bottom: 0;
		left: 0;
		top: 0;
		padding: var(--rz-size-2) var(--rz-size-5);
		background-color: hsl(var(--rz-ground-4) / 0.5);
		border-right: var(--rz-border);
		width: var(--rz-size-72);

		.rz-nav__toggle {
			position: absolute;
			display: none;
			align-items: center;
			justify-content: center;
			width: var(--rz-size-6);
			height: 100vh;
			right: 0;
			translate: var(--rz-size-3) 0;
			z-index: 10;
			top: 0;
			display: none;
			cursor: w-resize;
			padding: var(--rz-size-2);
			@media (min-width: 1024px) {
				display: flex;
			}
		}
	}
	.rz-nav--collapsed {
		width: var(--rz-size-20);
		padding: var(--rz-size-3);
		:global(.rz-button-nav) {
			justify-content: start;
		}
		.rz-nav__toggle {
			cursor: e-resize;
		}
	}
	.rz-nav__content {
		display: flex;
		height: 100%;
		flex-direction: column;
	}
	.rz-nav__header {
		display: flex;
		height: var(--rz-size-14);
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		padding-right: var(--rz-size-4);
		padding-left: var(--rz-size-4);
		
		&.rz-nav__header--collapsed {
			justify-content: center;
		}
	}
	.rz-nav__body {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: space-between;
	}
	.rz-nav__group-none {
		padding: 0 var(--rz-size-4);
		display: flex;
		flex-direction: column;
		gap: var(--rz-size-2);
	}
	.rz-nav__nav {
		border-radius: var(--rz-radius-lg);
	}
	.rz-nav--collapsed .rz-nav__nav {
		align-items: center;
	}
	.rz-nav__user {
		padding-bottom: var(--rz-size-2);
	}
</style>
