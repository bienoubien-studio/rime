<script lang="ts">
	import * as Card from '$lib/panel/components/ui/card';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import type { FormErrors } from 'rizom/types';
	import { usersFields } from 'rizom/collection/auth/usersFields';
	import { text } from 'rizom/fields';
	import { createAuthClient } from 'better-auth/svelte';
	import { goto } from '$app/navigation';

	type Props = {
		forgotPasswordLink?: boolean;
		form?: { email?: string; password?: string; errors?: FormErrors };
	};
	let { form, forgotPasswordLink }: Props = $props();

	const authClient = createAuthClient();
	let context = setFormContext(form || {}, 'login');

	const handleSignIn = async (e: SubmitEvent) => {
		e.preventDefault();

		await authClient.signIn.email(
			{
				email: context.form.email,
				password: context.form.password
			},
			{
				onRequest: () => {
					//show loading
				},
				onSuccess: (ctx) => {
					goto('/panel');
				},
				onError: (ctx) => {
					context.errors.set('password', 'Invalid email or password');
					context.errors.set('email', 'Invalid email or password');
				}
			}
		);
	};

	$effect(() => {
		const hasChanges = 'email' in context.changes || 'password' in context.changes;
		if (hasChanges) {
			context.errors.delete('email');
			context.errors.delete('password');
		}
	});
</script>

<div class="rz-login-container">
	<form onsubmit={handleSignIn}>
		<Card.Root>
			<Card.Header>
				<Card.Title>Connexion</Card.Title>
			</Card.Header>
			<Card.Content>
				<Email config={usersFields.email.toField()} form={context} />
				<Text type="password" config={text('password').required().toField()} form={context} />
			</Card.Content>
			<Card.Footer>
				<Button size="lg" disabled={!context.canSubmit} type="submit">Login</Button>
				{#if forgotPasswordLink}
					<Button variant="link" href="/forgot-password?slug=users">Forgot your password ?</Button>
				{/if}
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<style type="postcss">
	.rz-login-container {
		display: grid;
		place-content: center;
		height: 100vh;
		width: 100vw;

		:global(.rz-card) {
			width: var(--rz-size-96);
		}
		:global(.rz-card-content > * + *) {
			margin-top: var(--rz-size-4);
		}
		:global(.rz-card-footer) {
			display: grid;
		}
		:global(.rz-card-footer .rz-button--link) {
			@mixin color ground-2;
			margin-top: var(--rz-size-3);
			font-size: var(--rz-text-xs);
		}
	}
</style>
