<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';

	type Props = {
		class?: string;
		visible: boolean;
		children: Snippet;
	} & HTMLFieldsetAttributes;

	let { class: className, children, visible, ...HTMLFieldsetProps }: Props = $props();
</script>

<fieldset
	class="rz-field-root {className}"
	data-visible={visible ? '' : null}
	class:rz-field-root--hidden={!visible}
	{...HTMLFieldsetProps}
>
	{@render children()}
</fieldset>

<style>
	.rz-field-root {
		container: rz-field-root / inline-size;
		position: relative;
	}
	.rz-field-root--hidden {
		display: none;
	}
</style>
