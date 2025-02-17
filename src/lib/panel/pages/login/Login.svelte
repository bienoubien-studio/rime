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
	import { t__ } from 'rizom/panel/i18n/index.js';
	import { Toaster } from 'rizom/panel/components/ui/sonner';
	import { toast } from 'svelte-sonner';

	type Props = {
		forgotPasswordLink?: boolean;
		form?: { email?: string; password?: string; errors?: FormErrors };
	};
	let { form, forgotPasswordLink }: Props = $props();

	const context = setFormContext(form || {}, 'login');

	$effect(() => {
		const formError = context.errors.get('_form');
		if (typeof formError === 'string') {
			toast.error(t__(`errors.${formError}`));
		}
	});
</script>

<Toaster />
<div class="rz-login">
	<div class="gradient"></div>
	<form method="POST" action="/login" use:enhance={context.enhance}>
		<!-- <form onsubmit={handleSignIn}> -->
		<h1>{t__('common.signin')}</h1>
		<Email config={usersFields.email.toField()} form={context} />
		<Text
			type="password"
			config={text('password').label(t__('fields.password')).required().toField()}
			form={context}
		/>

		<Button size="xl" disabled={!context.canSubmit} type="submit">Login</Button>

		{#if forgotPasswordLink}
			<Button variant="link" href="/forgot-password?slug=users">Forgot your password ?</Button>
		{/if}
	</form>
</div>

<style type="postcss">
	.rz-login {
		display: grid;
		grid-template-columns: 1fr;
		@media (min-width: 768px) {
			grid-template-columns: 0.8fr 1.2fr;
		}
		height: 100vh;
		width: 100vw;
		background-color: hsl(var(--rz-ground-7));
		form {
			display: flex;
			flex-direction: column;
			justify-content: center;
			width: min(500px, 90%);
			gap: var(--rz-size-4);
			margin-bottom: 10vh;
			padding: var(--rz-size-20);
			border-left: var(--rz-border);
			h1 {
				font-size: var(--rz-text-6xl);
				@mixin font-semibold;
			}
			:global(fieldset label) {
				display: none;
			}
			:global(fieldset label) {
				display: none;
			}
			:global(fieldset .rz-field-error) {
				top: calc(-1 * var(--rz-size-6));
			}
			:global(fieldset input) {
				font-size: var(--rz-text-md);
				padding: 0 var(--rz-size-5);
				height: var(--rz-size-14);
			}
		}
		:global(.rz-login__form-error) {
			color: hsl(var(--rz-color-error));
		}
	}

	.gradient {
		display: none;
		@media (min-width: 768px) {
			display: block;
		}
		@media (prefers-color-scheme: light) {
			/* background-image: linear-gradient(32deg, hsl(210deg 40% 84%) 0%, hsl(250deg 50% 94%) 70%); */
			background-image: linear-gradient(32deg, #c2efee 0%, #d9eddf 100%);
		}
		@media (prefers-color-scheme: dark) {
			background-image: linear-gradient(32deg, #006e6c 0%, #d9eddf 100%);
		}
	}
</style>
