<script lang="ts">
	import * as Card from '$lib/panel/components/ui/card';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { enhance } from '$app/forms';
	import type { FormErrors } from 'rizom/types';
	import { usersFields } from 'rizom/collection/auth/usersFields';
	import { text } from 'rizom/fields';
	import { t__ } from 'rizom/panel/i18n';

	type Props = {
		forgotPasswordLink?: boolean;
		form?: { email?: string; password?: string; errors?: FormErrors };
	};
	let { form, forgotPasswordLink }: Props = $props();

	const context = setFormContext(form || {}, 'login');
</script>

<div class="rz-login">
	<form method="POST" action="/login" use:enhance={context.enhance}>
		<!-- <form onsubmit={handleSignIn}> -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Connexion</Card.Title>
			</Card.Header>
			<Card.Content>
				<Email config={usersFields.email.toField()} form={context} />
				<Text
					type="password"
					config={text('password').label(t__('fields.password')).required().toField()}
					form={context}
				/>
			</Card.Content>
			<Card.Footer>
				<Button size="lg" disabled={!context.canSubmit} type="submit">Login</Button>
				{#if context.errors?.has('_form')}
					<span class="rz-login__form-error">{t__('errors.' + context.errors.get('_form'))}</span>
				{/if}
				{#if forgotPasswordLink}
					<Button variant="link" href="/forgot-password?slug=users">Forgot your password ?</Button>
				{/if}
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<style type="postcss">
	.rz-login {
		display: grid;
		place-content: center;
		height: 100vh;
		width: 100vw;

		:global(.rz-login__form-error) {
			color: hsl(var(--rz-color-error));
		}

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
