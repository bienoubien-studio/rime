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
		}
	}

	.rz-auth__left {
		display: none;
		@media (min-width: 768px) {
			display: block;
		}

		background-size: 100% 100%;
		background-position:
			0px 0px,
			0px 0px,
			0px 0px,
			0px 0px;
		background-image:
			radial-gradient(113% 91% at 17% -2%, #0f0721ff 1%, #ff000000 99%),
			radial-gradient(142% 91% at 83% 7%, oklch(0.21 0.2 200) 1%, #00ff8e00 99%),
			radial-gradient(142% 91% at 111% 84%, #0a0b26ff 0%, #1e1c4cff 100%);
	}

	.rz-auth__left.rz-auth__left--image {
		background-size: cover;
	}
</style>
