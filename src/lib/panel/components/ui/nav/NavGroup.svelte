<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	type Props = {
		children: Snippet;
		navCollapsed: boolean;
		name: string;
	};
	const { children, name, navCollapsed }: Props = $props();
	const initialCollapsed = localStorage.getItem(`NavGroupCollapsed:${name}`) === 'true';
	let groupCollapsed = $state(initialCollapsed);

	const setCollapsed = () => {
		groupCollapsed = !groupCollapsed;
		localStorage.setItem(`NavGroupCollapsed:${name}`, groupCollapsed.toString());
	};

	const navCollapsedClassModifier = $derived(navCollapsed ? 'rz-nav-group--nav-collapsed' : '');
	const groupCollapsedClassModifier = $derived(groupCollapsed ? 'rz-nav-group--collapsed' : '');
</script>

<div class="rz-nav-group {navCollapsedClassModifier} {groupCollapsedClassModifier}">
	{#if !navCollapsed}
		<button onclick={setCollapsed} class="rz-nav-group__trigger">
			<span>{name}</span>
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
		/* margin-bottom: var(--rz-size-3); */
	}
	.rz-nav-group--collapsed {
		margin-bottom: 0;
	}
	.rz-nav-group--nav-collapsed {
		/* border-top: var(--rz-border); */
		padding-top: var(--rz-size-2);
		margin-bottom: 0;
	}

	.rz-nav-group__content {
		display: grid;
		padding: 0 var(--rz-size-7);
		border-bottom: var(--rz-border);
		background-color: hsl(var(--rz-ground-5) / 0.6);
		/* @media (prefers-color-scheme: light) {
			background-color: hsl(var(--rz-ground-7));
		} */
	}
	.rz-nav-group--nav-collapsed .rz-nav-group__content {
		background-color: transparent;
	}

	.rz-nav-group__trigger {
		padding: var(--rz-size-4);
		display: flex;
		width: 100%;
		gap: var(--rz-size-2);
		align-items: center;
		text-transform: capitalize;
		justify-content: space-between;
		text-align: left;
		border-bottom: var(--rz-border);
	}
</style>
