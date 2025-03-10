<script lang="ts">
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import Button from '../button/button.svelte';
	import { LogOut } from '@lucide/svelte';
	import * as Tooltip from '$lib/panel/components/ui/tooltip';

	type Props = { navCollapsed: boolean };
	const { navCollapsed }: Props = $props();

	const user = getUserContext();
	// let form = $state<HTMLFormElement>();
</script>

<form class="rz-logout-form" action="/logout" method="POST">
	{#if !navCollapsed}
		<div class="rz-user-button">
			<div class="rz-user-button__left">
				<a href="/panel/users/{user.attributes.id}">
					{user.attributes.name?.charAt(0) || ''}
				</a>
				<div class="rz-user-button__name">{user.attributes.name}</div>
			</div>

			<Button type="submit" variant="ghost" size="icon">
				<LogOut size="12" />
			</Button>
		</div>
	{:else}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button {...props} type="submit" variant="ghost" size="icon">
							<LogOut size="12" />
						</Button>
					{/snippet}
				</Tooltip.Trigger>

				<Tooltip.Content side="right">Logout</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
</form>

<style type="postcss">
	.rz-logout-form {
		:global(.rz-button[type='submit']) {
			width: var(--rz-size-10);
			height: var(--rz-size-10);
			padding: var(--rz-size-2);
			border-radius: var(--rz-radius-md);
		}
	}
	.rz-user-button {
		background-color: hsl(var(--rz-ground-6));
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--rz-size-2);
		border-radius: var(--radius-md);
		padding: var(--rz-size-2);
		box-shadow: var(--rz-shadow-sm);
	}
	.rz-user-button__left {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--rz-size-2);
	}
	.rz-user-button__left a {
		background-color: hsl(var(--rz-ground-0));
		@mixin color ground-6;
		@mixin size var(--rz-size-8);
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border-radius: var(--rz-radius-md);
		font-size: var(--rz-text-xs);
		text-transform: uppercase;
	}
	.rz-user-button__name {
		@mixin line-clamp 1;
		font-size: var(--rz-text-xs);
		/* line-clamp-1 truncate text-xs */
	}
</style>
