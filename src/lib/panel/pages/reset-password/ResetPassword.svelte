<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import type { FormErrors } from 'rizom/types/panel.js';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import { toast } from 'svelte-sonner';
	import { password, confirmPassword } from 'rizom/config/auth/usersFields';
	import AuthForm from 'rizom/panel/components/sections/auth/AuthForm.svelte';
	import { t__ } from 'rizom/panel/i18n';
	import { authClient } from 'rizom/panel/util/auth';

	interface Props {
		token: string;
		slug: string;
		form?: { errors?: FormErrors };
	}

	const { form }: Props = $props();
	let success = $state(false);

	const context = setFormContext(form || {}, 'reset-password');

	const passwordField = password.placeholder(t__('common.newPassword')).compile();
	const confirmPasswordField = confirmPassword.placeholder(t__('common.confirmPassword')).compile();

	async function resetPassword() {
		const token = new URLSearchParams(window.location.search).get('token');
		if (!token) {
			return toast.error('An error occured');
		}
		const { data, error } = await authClient.resetPassword({
			newPassword: context.form.password,
			token
		});
		if (error) {
			console.error(error);
			toast.error(error.message || 'An error occured');
		}
		if (data && data.status) {
			success = true;
		}
	}
</script>

<AuthForm title={t__('common.resetPassword')}>
	{#if success}
		<p>{t__('common.resetPasswordSuccess')}</p>
		<Button size="xl" href="/login">{t__('common.login')}</Button>
	{:else}
		<Text type="password" config={passwordField} form={context} />
		<Text type="password" config={confirmPasswordField} form={context} />

		<Button
			size="xl"
			disabled={!(context.canSubmit && context.form.password && context.form.confirmPassword)}
			onclick={resetPassword}
		>
			{t__('common.resetPassword')}
		</Button>
	{/if}
</AuthForm>
