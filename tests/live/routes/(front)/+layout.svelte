<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { setLiveContext } from '$lib/panel/context/live.svelte';

  import { classList } from '$lib/utils/classList';

  const { children } = $props();

  let live = setLiveContext($page.url.href);
  beforeNavigate(live.beforeNavigate);

</script>

<svelte:window onmessage={live.onMessage} />
<svelte:body use:classList={'app'} />


{@render children()}
