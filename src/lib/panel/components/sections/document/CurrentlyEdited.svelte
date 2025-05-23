<script lang="ts">
	import { Button } from '../../ui/button';
	import { onMount } from 'svelte';
	import type { GenericDoc } from '$lib/core/types/doc.js';
	import type { User } from '$lib/types/auth.js';
	import { PANEL_USERS } from '$lib/core/constant';

	type Props = { by: string; user: User; doc: GenericDoc };
	const { by, user, doc }: Props = $props();

	async function takeControl() {
		const fetchURl = `/api/${doc._type}/${doc._prototype === 'collection' ? doc.id : ''}`;

		await fetch(fetchURl, {
			method: 'PATCH',
			body: JSON.stringify({
				editedBy: user.id
			})
		});
		window.location.reload();
	}

	let email = $state();

	onMount(async () => {
		const { doc } = await fetch(`/api/${PANEL_USERS}/${by}`).then((r) => r.json());
		email = doc.email;
	});
</script>

<div class="rz-document-read-only">
	<p><strong>{email}</strong> is editing the document</p>
	<Button variant="outline" onclick={takeControl}>Take control</Button>
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
