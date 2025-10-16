<script lang="ts">
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		title: string;
		image: string | null;
	};
	const { image, children, title }: Props = $props();
</script>

<Toaster />
<div class="rz-auth">
	<div
		class="rz-auth__left"
		class:rz-auth__left--image={!!image}
		style={image ? `background-image:url(${image})` : null}
	></div>
	<div class="rz-auth__right">
		<h1>{title}</h1>
		{@render children()}
	</div>
</div>

<style type="postcss">
	.rz-auth {
		display: grid;
		grid-template-columns: 1fr;
		@media (min-width: 1024px) {
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
			width: 100%;
			gap: var(--rz-size-4);
			margin-bottom: 10vh;
			padding: var(--rz-size-12);
			@media (min-width: 768px) {
				padding: var(--rz-size-20);
			}
			@media (min-width: 1024px) {
				width: min(500px, 90%);
				border-left: var(--rz-border);
			}
			height: 100%;
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
		}
	}

	.rz-auth__left {
		display: none;
		@media (min-width: 1024px) {
			display: block;
		}

		background-size: cover;
		background-position:
			0px 0px,
			0px 0px,
			0px 0px,
			0px 0px;
		background-image:
			url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='30.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.88'/%3E%3C/svg%3E"),
			radial-gradient(113% 91% at 17% -2%, oklch(0.21 0.21 290) 1%, oklch(0 0 0 / 0) 99%),
			radial-gradient(142% 91% at 83% 7%, oklch(0.21 0.12 80) 1%, oklch(0.85 0.23 155 / 0) 99%),
			radial-gradient(142% 91% at 111% 84%, oklch(0.13 0.08 300) 0%, oklch(0.05 0.1 250) 100%);
	}

	.rz-auth__left.rz-auth__left--image {
		background-size: cover;
	}
</style>
