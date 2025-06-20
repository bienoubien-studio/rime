<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import * as Dialog from './index.js';
	import './dialog-content.css';

	let {
		ref = $bindable(null),
		class: className,
		size = 'default',
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		children: Snippet;
		size?: 'sm' | 'default' | 'lg'
	} = $props();
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content bind:ref class="rz-dialog-content rz-dialog-content--{size} {className}" {...restProps}>
		{@render children?.()}
	</DialogPrimitive.Content>
</Dialog.Portal>
