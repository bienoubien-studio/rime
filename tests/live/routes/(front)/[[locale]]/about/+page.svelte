<script lang="ts">
	import { getLiveContext } from '$lib/panel/context/live.svelte';

	const { data } = $props();

	const live = getLiveContext();

	$effect(() => {
		if (live.enabled) {
			live.doc = data.doc;
		}
	});

	const doc = $derived(live.doc || data.doc);
</script>

<main>
	<a class="underline underline-offset-2" href="mailto:{doc.email}">contact</a>
	<a class="underline underline-offset-2" href="https://instagram.com/{doc.instagram}">
		{doc.instagram}
	</a>
</main>
