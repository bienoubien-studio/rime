<script lang="ts">
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		title: string;
	};
	const { children, title }: Props = $props();
</script>

<Toaster />
<div class="rz-auth">
	<div class="rz-auth__left"></div>
	<div class="rz-auth__right">
		<h1>{title}</h1>
		{@render children()}
	</div>
</div>

<style type="postcss">
	.rz-auth {
		display: grid;
		grid-template-columns: 1fr;
		@media (min-width: 768px) {
			grid-template-columns: 0.8fr 1.2fr;
		}
		height: 100vh;
		width: 100vw;
		background-color: hsl(var(--rz-color-bg));

		.rz-auth__right {
			--rz-input-height: var(--rz-size-14);

			display: flex;
			flex-direction: column;
			justify-content: center;
			width: min(500px, 90%);
			gap: var(--rz-size-4);
			margin-bottom: 10vh;
			padding: var(--rz-size-20);
			border-left: var(--rz-border);
			h1 {
				font-size: clamp(var(--rz-text-3xl), 2.5vw, var(--rz-text-5xl));
				line-height: 1;
				@mixin font-semibold;
			}
			:global(form) {
				flex-direction: column;
				display: flex;
				flex-direction: column;
				justify-content: center;
				width: 100%;
				gap: var(--rz-size-4);
			}
			/* :global(fieldset label) {
				display: none;
			} */
			/* :global(fieldset .rz-field-error) {
				top: calc(-1 * var(--rz-size-6));
			} */
			/* :global(fieldset input) {
				font-size: var(--rz-text-md);
				padding: 0 var(--rz-size-5);
				height: var(--rz-size-14);
			} */
		}
	}

	.rz-auth__left {
		display: none;
		@media (min-width: 768px) {
			display: block;
		}
		@media (prefers-color-scheme: light) {
			background-image: linear-gradient(32deg, #c2efee 0%, #d9eddf 100%);
		}
		@media (prefers-color-scheme: dark) {
			background-image: linear-gradient(32deg, #006e6c 0%, #d9eddf 100%);
		}
	}
</style>
