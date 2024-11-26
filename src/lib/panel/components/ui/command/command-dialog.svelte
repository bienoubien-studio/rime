<script lang="ts">
	import type {
		Command as CommandPrimitive,
		Dialog as DialogPrimitive,
		WithoutChildrenOrChild
	} from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Command from './command.svelte';
	import * as Dialog from '../dialog/index';

	let {
		open = $bindable(false),
		ref = $bindable(null),
		value = $bindable(''),
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.RootProps> &
		WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
			children: Snippet;
		} = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Content class="rz-command-dialog-content">
		<Command
			class="rz-command-dialog-content__command"
			{...restProps}
			bind:value
			bind:ref
			{children}
		/>
	</Dialog.Content>
</Dialog.Root>

<style type="postcss">
	:global {
		.rz-command-dialog-content {
			overflow: hidden;
			padding: 0;
		}

		.rz-command-dialog-content__command [data-cmdk-group-heading] {
			@mixin color color-fg, 0.7;
			padding-left: var(--rz-size-2);
			padding-right: var(--rz-size-2);
			@mixin font-medium;
		}

		.rz-command-dialog-content__command [data-cmdk-group]:not([hidden]) ~ [data-cmdk-group] {
			padding-top: 0;
		}

		.rz-command-dialog-content__command [data-cmdk-group] {
			padding-left: var(--rz-size-2);
			padding-right: var(--rz-size-2);
		}

		.rz-command-dialog-content__command [data-cmdk-input-wrapper] svg {
			height: var(--rz-size-5);
			width: var(--rz-size-5);
		}

		.rz-command-dialog-content__command [data-cmdk-input] {
			height: var(--rz-size-12);
		}

		.rz-command-dialog-content__command [data-cmdk-item] {
			padding-left: var(--rz-size-2);
			padding-right: var(--rz-size-2);
			padding-top: var(--rz-size-3);
			padding-bottom: var(--rz-size-3);
		}

		.rz-command-dialog-content__command [data-cmdk-item] svg {
			height: var(--rz-size-5);
			width: var(--rz-size-5);
		}
	}
</style>
