<script lang="ts">
	type Props = { status: 'draft' | 'published' };
	const { status }: Props = $props();
</script>

<div class:rz-status__dot--draft={status === 'draft'} class="rz-status__dot"></div>

<style>
	.rz-status__dot {
		flex-shrink: 0;
		background-color: var(--rz-color-success, hsl(180deg, 80%, 60%));
		width: var(--rz-dot-size, 0.8rem);
		height: var(--rz-dot-size, 0.8rem);
		border-radius: 0.8rem;
		&.rz-status__dot--draft {
			background-color: var(--rz-color-warn, hsl(17deg, 70%, 60%));
		}
	}
</style>
