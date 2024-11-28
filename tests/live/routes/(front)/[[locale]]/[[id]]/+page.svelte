<script lang="ts">
  import { getLiveContext } from '$src/lib/cms/panel/context/live.svelte';
  import Page from '$lib/front/components/containers/Page.svelte';
  import type { PageData } from '../../../(front)/[[locale]]/[[id]]/$types';

  type Props = { data: PageData };

  let { data }: Props = $props();

  const live = getLiveContext();

  $effect(() => {
    if (live.enabled) {
      live.doc = data.doc;
    }
  });

  const doc = $derived(live.doc || data.doc);
</script>

<Page {doc} />
