<script lang="ts">
	import { type Snippet } from 'svelte';

	// Props
	type Props = {
		class?: string;
		children: Snippet;
	};
	const { children, class: className }: Props = $props();

	//
</script>

<div class="rz-page-header {className}">
	{@render children()}
</div>

<style type="postcss" global>
	.rz-page-header {
		position: sticky;
		left: 0;
		right: 0;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--rz-size-4);
		height: var(--rz-size-14);
		border-bottom: var(--rz-border);
		backdrop-filter: blur(8px);
		@mixin px var(--rz-field-padding, var(--rz-size-6));
	}
</style>
