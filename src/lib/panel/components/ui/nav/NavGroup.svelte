<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { ChevronDown, ChevronUp, type IconProps } from '@lucide/svelte';

	type Props = {
		children: Snippet;
		navCollapsed: boolean;
		name: string;
		icon: Component<IconProps> | null;
	};
	const { children, name, navCollapsed, icon }: Props = $props();

	let groupCollapsed = $state(false);

	const setCollapsed = () => {
		groupCollapsed = !groupCollapsed;
		localStorage.setItem(`NavGroupCollapsed:${name}`, groupCollapsed.toString());
	};

	$effect(() => {
		groupCollapsed = localStorage.getItem(`NavGroupCollapsed:${name}`) === 'true';
	});

	const navCollapsedClassModifier = $derived(navCollapsed ? 'rz-nav-group--nav-collapsed' : '');
	const groupCollapsedClassModifier = $derived(groupCollapsed ? 'rz-nav-group--collapsed' : '');
</script>

<div class="rz-nav-group {navCollapsedClassModifier} {groupCollapsedClassModifier}">
	{#if !navCollapsed}
		<button onclick={setCollapsed} class="rz-nav-group__trigger">
			<span>
				{#if icon}
					{@const IconComp = icon}
					<IconComp size="15" />
				{/if}
				{name}
			</span>
			{#if groupCollapsed}
				<ChevronDown size="12" />
			{:else}
				<ChevronUp size="12" />
			{/if}
		</button>
	{/if}
	{#if !groupCollapsed || navCollapsed}
		<div class="rz-nav-group__content">
			{@render children()}
		</div>
	{/if}
</div>

<style type="postcss" global>
	.rz-nav-group {
		width: 100%;
		position: sticky;
		top: 0;
		z-index: 20;
		margin-bottom: var(--rz-size-2);
		background-color: hsl(var(--rz-ground-6));
		border-radius: var(--rz-radius-lg);
	}

	.rz-nav-group--nav-collapsed {
		padding-top: var(--rz-size-2);
	}

	.rz-nav-group__content {
		display: grid;
		padding: 0 var(--rz-size-4);
		background-color: hsl(var(--rz-ground-5) / 0.6);
	}
	.rz-nav-group--nav-collapsed .rz-nav-group__content {
		background-color: transparent;
		padding: 0 var(--rz-size-5);
	}

	.rz-nav-group__trigger {
		padding: var(--rz-size-3);
		display: flex;
		width: 100%;
		gap: var(--rz-size-2);
		align-items: center;
		text-transform: capitalize;
		justify-content: space-between;
		text-align: left;
		border-bottom: var(--rz-border);
		span {
			display: flex;
			align-items: center;
			gap: var(--rz-size-3);
		}
	}
</style>
