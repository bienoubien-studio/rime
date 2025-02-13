<script lang="ts">
	import Document from 'rizom/panel/components/areas/document/Document.svelte';
	import type { GlobalProps } from './props.js';
	import Unauthorized from 'rizom/panel/components/areas/unauthorized/Unauthorized.svelte';

	const { data }: GlobalProps = $props();
</script>

{#if data.status === 200}
	<div class="rz-global-container">
		<Document doc={data.doc} readOnly={data.readOnly} operation="update" />
	</div>
{:else}
	<Unauthorized />
{/if}

<style type="postcss">
	.rz-global-container {
		display: grid;
	}
</style>
