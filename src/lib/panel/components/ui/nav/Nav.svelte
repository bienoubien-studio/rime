<script lang="ts">
	import NavItem from './NavItem.svelte';
	import NavGroup from './NavGroup.svelte';
	import UserButton from './UserButton.svelte';
	import type { Route } from 'rizom/types/panel';

	import { PanelsTopLeft } from 'lucide-svelte';

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
		<!-- <div class="rz-nav__header">
			<a href="/panel">
				<Logo />
			</a>
		</div> -->

		<div class="rz-nav__body">
			<nav class="rz-nav__nav">
				<NavItem href={dashBoardRoute.path} {isCollapsed} route={dashBoardRoute} />
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
					<NavItem href={route.path} {isCollapsed} {route} />
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
		background-color: hsl(var(--rz-ground-5) / 0.7);
		position: fixed;
		bottom: 0;
		left: 0;
		top: 0;
		border-right: var(--rz-border);
		width: var(--rz-size-72);
	}
	.rz-nav--collapsed {
		width: var(--rz-size-20);
	}
	.rz-nav__content {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding-top: var(--rz-size-2);
	}
	/* .rz-nav__header {
		display: flex;
		margin-top: 2px;
		height: var(--rz-size-16);
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		padding-right: var(--rz-size-4);
		padding-left: var(--rz-size-6);
	} */
	.rz-nav__body {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--rz-size-4);
		padding-top: var(--rz-size-1);

		/* @media (min-width: 1024px) {
			padding-top: var(--rz-size-5);
		} */
	}

	.rz-nav__nav {
		display: flex;
		flex-direction: column;
		gap: var(--rz-size-2);
		@mixin px var(--rz-size-4);
	}
	.rz-nav--collapsed .rz-nav__nav {
		align-items: center;
	}
	.rz-nav__user {
		@mixin px var(--rz-size-4);
		padding-bottom: var(--rz-size-6);
	}
</style>
