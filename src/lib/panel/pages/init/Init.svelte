<script lang="ts">
	import { enhance } from '$app/forms';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { toast } from 'svelte-sonner';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import type { FormErrors } from 'rizom/types';
	import { text } from 'rizom/fields';
	import { usersFields } from 'rizom/config/auth/usersFields';
	import AuthForm from 'rizom/panel/components/sections/auth/AuthForm.svelte';
	import { t__ } from 'rizom/panel/i18n';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { KeyRound } from '@lucide/svelte';

	type Props = { form?: { email?: string; password?: string; errors?: FormErrors } };
	let { form }: Props = $props();

	const context = setFormContext(form || {}, 'init');

	$effect(() => {
		if (context.status === 'failure') {
			toast.warning('Invalid credential');
		}
	});
	const nameField = text('name').layout('compact').required().compile();
	const emailField = usersFields.email.layout('compact').compile()
	const passwordField = usersFields.password.layout('compact').compile()

</script>

<AuthForm title={t__('common.create_first', 'admin')}>
	<form method="POST" use:enhance={context.enhance}>
		<Text config={nameField} form={context} />
		<Email config={emailField} form={context} />
		<Text icon={KeyRound} type="password" config={passwordField} form={context} />
		<Button type="submit" size="xl">{t__('common.create')}</Button>
	</form>
</AuthForm>
