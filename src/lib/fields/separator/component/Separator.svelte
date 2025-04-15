<script lang="ts">
	type Props = { class?: string };
	const { class: className }: Props = $props();
</script>

<hr class="rz-separator {className}" />

<style>
	.rz-separator {
		margin-left: calc(-1 * var(--rz-fields-padding));
		margin-right: calc(-1 * var(--rz-fields-padding));
		margin-bottom: var(--rz-size-4);
	}
</style>
