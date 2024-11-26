<script lang="ts">
	import * as Card from '$lib/panel/components/ui/card';
</script>

<div class="rz-locked">
	<Card.Root>
		<Card.Header>
			<Card.Title>Maximum login attempts reached</Card.Title>
			<Card.Description>User has been locked, try again in few minutes.</Card.Description>
		</Card.Header>
	</Card.Root>
</div>

<style type="postcss">
	.rz-locked {
		display: grid;
		place-content: center;
		height: 100vh;
		width: 100vw;
		:global(.rz-card-header) {
			display: grid;
		}
	}
</style>
