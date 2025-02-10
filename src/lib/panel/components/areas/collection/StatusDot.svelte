<script lang="ts">
	type Props = { color: string };
	const { color }: Props = $props();
</script>

<div style="--rz-status-color:{color}" class="rz-status__dot"></div>

<style>
	.rz-status__dot {
		flex-shrink: 0;
		background-color: var(--rz-status-color, hsl(180deg, 80%, 60%));
		width: var(--rz-dot-size, 0.8rem);
		height: var(--rz-dot-size, 0.8rem);
		border-radius: 0.8rem;
	}
</style>
