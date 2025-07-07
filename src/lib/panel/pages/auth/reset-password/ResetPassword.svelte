<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import type { FormErrors } from '$lib/panel/types.js';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import Text from '$lib/fields/text/component/Text.svelte';
	import { toast } from 'svelte-sonner';
	import AuthForm from '$lib/panel/components/sections/auth/AuthForm.svelte';
	import { t__ } from '$lib/core/i18n';
	import { authClient } from '$lib/panel/util/auth';
	import { passwordField } from '$lib/panel/pages/auth/fields.js';

	interface Props {
		form?: { errors?: FormErrors };
	}

	const { form }: Props = $props();
	let success = $state(false);

	const context = setFormContext(form || {}, 'reset-password');

	const passwordConfig = {
		...passwordField,
		placeholder: t__('common.newPassword')
	};
	const confirmPasswordConfig = {
		...passwordField,
		placeholder: t__('common.confirmPassword')
	};

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
			return toast.error(error.message || 'An error occured');
		}
		success = data?.status;
	}
</script>

<AuthForm title={t__('common.resetPassword')}>
	{#if success}
		<p>{t__('common.resetPasswordSuccess')}</p>
		<Button size="xl" href="/panel/sign-in">{t__('common.login')}</Button>
	{:else}
		<Text type="password" config={passwordConfig} form={context} />
		<Text type="password" config={confirmPasswordConfig} form={context} />
		
		<Button
			size="xl"
			disabled={!(context.canSubmit && context.form.password && context.form.confirmPassword)}
			onclick={resetPassword}
		>
			{t__('common.resetPassword')}
		</Button>
	{/if}
</AuthForm>
