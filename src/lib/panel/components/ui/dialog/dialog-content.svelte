<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import X from 'lucide-svelte/icons/x';
	import type { Snippet } from 'svelte';
	import * as Dialog from './index.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		children: Snippet;
	} = $props();
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content bind:ref class="rz-dialog-content {className}" {...restProps}>
		{@render children?.()}
		<DialogPrimitive.Close class="rz-dialog-content__close">
			<X size={16} />
			<span class="rz-sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>

<style type="postcss">
	:global {
		.rz-dialog-content {
			@mixin bg color-bg;
			position: fixed;
			left: 50%;
			top: 50%;
			z-index: 50;
			display: grid;
			width: 100%;
			max-width: 32rem;
			transform: translate(-50%, -50%);
			gap: var(--rz-size-4);
			border: var(--rz-border);
			padding: var(--rz-size-6);
			box-shadow: var(--rz-shadow-lg);
		}

		@media (min-width: 640px) {
			.rz-dialog-content {
				border-radius: var(--rz-radius-lg);
			}
		}

		@media (min-width: 768px) {
			.rz-dialog-content {
				width: 100%;
			}
		}

		.rz-dialog-content__close {
			@mixin color color-fg, 0.7;
			position: absolute;
			right: var(--rz-size-4);
			top: var(--rz-size-3);
			border-radius: var(--rz-radius-sm);
			opacity: 0.7;
			transition: opacity 0.2s;
		}

		.rz-dialog-content__close:focus {
			outline: none;
			--rz-ring-offset-2: 2px;
			@mixin ring var(--rz-color-ring);
		}

		.rz-dialog-content__close:disabled {
			pointer-events: none;
		}
	}
</style>
