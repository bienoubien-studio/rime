<script lang="ts">
	import Document from 'rizom/panel/components/sections/document/Document.svelte';
	import type { AreaProps } from './props.js';
	import Unauthorized from 'rizom/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { setAPIProxyContext } from 'rizom/panel/context/api-proxy.svelte.js';

	const { data }: AreaProps = $props();

	setAPIProxyContext('document');
	
</script>

{#if data.status === 200}
	<div class="rz-area-container">
		<Document doc={data.doc} readOnly={data.readOnly} operation="update" />
	</div>
{:else}
	<Unauthorized />
{/if}

<style type="postcss">
	.rz-area-container {
		display: grid;
	}
</style>
