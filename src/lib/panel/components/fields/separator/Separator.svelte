<script lang="ts">
	type Props = { class?: string };
	const { class: className }: Props = $props();
</script>

<hr class="rz-separator {className}" />

<style type="postcss">
	.rz-separator {
		margin-left: calc(-1 * var(--rz-size-6));
		margin-right: calc(-1 * var(--rz-size-6));
		margin-bottom: var(--rz-size-4);
	}
</style>
