<script lang="ts" generics="T">
	import { getLiveContext } from '$lib/panel/context/live.svelte.js';
	import type { WithRelationPopulated } from 'rizom/types/util.js';

	let { child, data } = $props<{
		child: (doc: WithRelationPopulated<T>) => any;
		data: { doc: T };
	}>();

	const live = getLiveContext();

	$effect(() => {
		if (live.enabled) {
			live.doc = data.doc;
		}
	});
	const doc = $derived(live.doc || data.doc) as WithRelationPopulated<T>;
</script>

{@render child(doc)}
