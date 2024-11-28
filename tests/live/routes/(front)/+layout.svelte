<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { setLiveContext } from '$src/lib/cms/panel/context/live.svelte';
  import { type Snippet } from 'svelte';
  import * as Layout from '$lib/front/components/layout';
  import { classList } from '$src/lib/cms/utils/classList';
  import Button from '$src/lib/cms/panel/ui/button/button.svelte';
  import Burger from '$src/lib/front/components/ui/burger/burger.svelte';
  type Props = { data: any; children: Snippet };
  const { children, data }: Props = $props();

  let live = setLiveContext($page.url.href);
  beforeNavigate(live.beforeNavigate);

  let open = $state(false);
</script>

<svelte:window onmessage={live.onMessage} />
<svelte:body use:classList={'app'} />

<Layout.Root>
  <Burger class="fixed right-6 top-6" bind:open />
  <Layout.Navigation items={data.menu.nav} />

  {@render children()}
</Layout.Root>
