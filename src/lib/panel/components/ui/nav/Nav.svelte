<script lang="ts">
	import NavItem from './NavItem.svelte';
	import NavGroup from './NavGroup.svelte';
	import UserButton from './UserButton.svelte';
	import type { Route } from 'rizom/types/panel';

	import { Home, PanelsTopLeft } from '@lucide/svelte';
	import Logo from './logo/Logo.svelte';

	type Props = { isCollapsed: boolean; routes: Record<string, Route[]> };
	const { isCollapsed, routes: routesGroups }: Props = $props();

	const dashBoardRoute: Route = {
		title: 'Dashboard',
		path: '/panel',
		icon: PanelsTopLeft
	};
</script>

<div class:rz-nav--collapsed={isCollapsed} class="rz-nav">
	<div class="rz-nav__content">
		<div class="rz-nav__header" class:rz-nav__header--collapsed={isCollapsed}>
			<!-- {#if isCollapsed} -->
			<NavItem href="/panel" {isCollapsed} route={dashBoardRoute} />
			<!-- {:else}
				<a href="/panel">
					<Logo />
				</a>
			{/if} -->
		</div>

		<div class="rz-nav__body">
			<nav class="rz-nav__nav">
				{#each Object.entries(routesGroups) as [groupName, routes]}
					{#if groupName !== 'none'}
						<NavGroup name={groupName} navCollapsed={isCollapsed}>
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

			<div class="rz-nav__user">
				<UserButton navCollapsed={isCollapsed} />
			</div>
		</div>
	</div>
</div>

<style type="postcss">
	.rz-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		top: 0;
		border-right: var(--rz-border);
		width: var(--rz-size-72);
	}
	.rz-nav--collapsed {
		width: var(--rz-size-20);
		:global(.rz-button-nav) {
			justify-content: start;
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
		border-bottom: var(--rz-border);

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
		display: flex;
		flex-direction: column;
		background-color: hsl(var(--rz-ground-6));
		/* @media (prefers-color-scheme: light) {
			background-color: hsl(var(--rz-ground-7));
		} */
	}
	.rz-nav--collapsed .rz-nav__nav {
		align-items: center;
	}
	.rz-nav__user {
		@mixin px var(--rz-size-4);
		padding-bottom: var(--rz-size-6);
	}
</style>
