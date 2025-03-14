<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { usersFields } from 'rizom/config/auth/usersFields';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import { toast } from 'svelte-sonner';
	import AuthForm from 'rizom/panel/components/sections/auth/AuthForm.svelte';
	import { authClient } from 'rizom/panel/util/auth';

	const context = setFormContext({}, 'login');

	let success = $state(false);

	$effect(() => {
		const formError = context.errors.get('_form');
		if (typeof formError === 'string') {
			toast.error(t__(`errors.${formError}`));
		}
	});

	async function sendResetPasswordMail() {
		const { data, error } = await authClient.forgetPassword({
			email: context.form.email,
			redirectTo: '/reset-password?slug=users'
		});
		if (error && error.message) {
			toast.error(error.message);
		}
		if (data && data.status) {
			success = data.status;
		}
	}
</script>

<AuthForm title={t__('common.forgotPassword')}>
	{#if success}
		<p>{t__('common.passwordResetLinkSent', context.form.email)}</p>
	{:else}
		<Email config={usersFields.email.compile()} form={context} />
		<Button size="xl" disabled={!context.canSubmit} onclick={sendResetPasswordMail}>
			{t__('common.requestPasswordReset')}
		</Button>
	{/if}
</AuthForm>

<style lang="postcss">
	p {
		font-size: var(--rz-text-lg);
		@mixin font-semibold;
	}
</style>
