<script lang="ts">
	type Props = { error: string | false };
	const { error }: Props = $props();
</script>

{#if error}
	<div class="rz-field-error">
		{error.split('::').at(-1)}
	</div>
{/if}

<style type="postcss">
	.rz-field-error {
		@mixin color ground-6;
		@mixin bg color-error;
		position: absolute;
		right: 0;
		top: 0;
		border-radius: var(--rz-radius-sm);
		@mixin px var(--rz-size-1);
		@mixin py var(--rz-size-0-5);
		font-size: var(--rz-text-xs);
		@mixin font-medium;
	}
</style>
