<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from '$lib/fields/email/component/Email.svelte';
	import Text from '$lib/fields/text/component/Text.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { enhance } from '$app/forms';
	import type { FormErrors } from '$lib/types';
	import { email } from '$lib/config/auth/usersFields.js';
	import { text } from '$lib/fields/text/index.js';
	import { t__ } from '$lib/i18n/index.js';
	import { toast } from 'svelte-sonner';
	import AuthForm from '$lib/panel/components/sections/auth/AuthForm.svelte';
	import { KeyRound } from '@lucide/svelte';

	type Props = {
		data: {
			forgotPasswordEnabled: boolean;
			form: { email?: string; password?: string; errors?: FormErrors };
		};
	};
	const { data }: Props = $props();

	const context = setFormContext(data.form, 'login');

	$effect(() => {
		const formError = context.errors.get('_form');
		if (typeof formError === 'string') {
			toast.error(t__(`errors.${formError}`));
		}
	});

	const passwordField = text('password')
		.layout('compact')
		.label(t__('fields.password'))
		.required()
		.compile();

	const emailField = email.layout('compact').compile();
</script>

<AuthForm title={t__('common.signin')}>
	<form method="POST" action="/login" use:enhance={context.enhance}>
		<Email config={emailField} form={context} />
		<Text type="password" icon={KeyRound} config={passwordField} form={context} />

		<Button size="xl" disabled={!context.canSubmit} type="submit">Login</Button>

		{#if data.forgotPasswordEnabled}
			<Button variant="link" href="/forgot-password">
				{t__('common.forgotPassword')}
			</Button>
		{/if}
	</form>
</AuthForm>
