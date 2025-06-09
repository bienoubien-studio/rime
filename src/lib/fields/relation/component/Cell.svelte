<script lang="ts">
	import { env } from "$env/dynamic/public";
	import UploadThumbCell from "$lib/panel/components/sections/collection/upload-thumb-cell/UploadThumbCell.svelte";
	import { getAPIProxyContext } from "$lib/panel/context/api-proxy.svelte.js";
	import { getConfigContext } from "$lib/panel/context/config.svelte.js";
	
  type Props = {
    value: {
			id?: string;
			relationTo: string;
			documentId: string;
		}[]
  }

  let { value }: Props = $props();
  let displayCount = $derived(value && value.length > 1)

  const APIProxy = getAPIProxyContext('root');
  
  let APIUrl = $derived.by(() => {
    if(value && value.length && value[0].documentId){
      return `${env.PUBLIC_RIZOM_URL}/api/${value[0].relationTo}/${value[0].documentId}`
    } else {
      return null
    }
  })
  
  const ressource = $derived.by(() => {
    return APIUrl ? APIProxy.getRessource(APIUrl) : null;
  })
  
</script>

<span>
  {#if displayCount}
    {value.length} items
  {:else if ressource?.data?.doc}
    {#if ressource.data.doc._thumbnail}
      <UploadThumbCell mimeType={ressource.data.doc.mimeType} url="{env.PUBLIC_RIZOM_URL}{ressource.data.doc._thumbnail}" /> {ressource.data.doc.title}
    {:else}
      {ressource.data.doc.title}
    {/if}
  {/if}
</span>

<style lang="postcss">
  span{
    display: flex;
    gap: var(--rz-size-2);
    align-items: center;
  }
</style>