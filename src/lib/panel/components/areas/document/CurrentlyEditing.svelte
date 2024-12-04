<script lang="ts">
	import { Button } from '../../ui/button';
	import { page } from '$app/stores';
	type Props = { email: string };
	const { email }: Props = $props();

	async function takeControl() {
		window.location.href = `${$page.url.pathname}?take_control=1`;
	}
</script>

<div class="rz-document-read-only">
	<p><strong>{email}</strong> is editing the document</p>
	<Button variant="outline" onclick={takeControl} href="{$page.url.pathname}?take_control=1"
		>Take control</Button
	>
</div>

<style lang="postcss">
	.rz-document-read-only {
		display: grid;
		gap: 1rem;
		place-content: center;
		position: absolute;
		inset: 0;
		z-index: 100;
		background: hsl(var(--rz-ground-7) / 0.8);
		backdrop-filter: blur(2px);
	}
</style>
