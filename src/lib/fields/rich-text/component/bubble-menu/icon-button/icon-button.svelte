<script lang="ts">
	import type { Component } from 'svelte';
	import './icon-button.css';
	import type { IconProps } from '@lucide/svelte';

	type Props = {
		icon: Component<IconProps>;
		type?: 'submit' | 'button';
		active?: boolean;
		class?: string;
		[x: string]: any;
	};

	const { class: className, icon: Icon, active, type = 'button', ...restProps }: Props = $props();

	const buttonActiveClass = $derived(active ? 'rz-icon-button--active' : '');
	const iconActiveClass = $derived(active ? 'rz-icon-button__icon--active' : '');
</script>

{#key active}
	<button class="rz-icon-button {buttonActiveClass} {className}" {type} {...restProps}>
		<Icon class="rz-icon-button__icon {iconActiveClass}" size={15} strokeWidth={2} />
	</button>
{/key}
