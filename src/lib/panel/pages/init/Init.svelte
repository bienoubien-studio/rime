<script lang="ts">
	import { enhance } from '$app/forms';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { toast } from 'svelte-sonner';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import type { FormErrors } from 'rizom/types';
	import { text } from 'rizom/fields';
	import { usersFields } from 'rizom/collection/auth/usersFields';
	import AuthForm from 'rizom/panel/components/sections/auth/AuthForm.svelte';
	import { t__ } from 'rizom/panel/i18n';
	import Button from 'rizom/panel/components/ui/button/button.svelte';

	type Props = { form?: { email?: string; password?: string; errors?: FormErrors } };
	let { form }: Props = $props();

	const context = setFormContext(form || {}, 'init');

	$effect(() => {
		if (context.status === 'failure') {
			toast.warning('Invalid credential');
		}
	});
</script>

<AuthForm title={t__('common.create_first', 'admin')}>
	<form method="POST" use:enhance={context.enhance}>
		<Text config={text('name').required().compile()} form={context} />
		<Email config={usersFields.email.compile()} form={context} />
		<Text type="password" config={usersFields.password.compile()} form={context} />
		<Button type="submit" size="xl">{t__('common.create')}</Button>
	</form>
</AuthForm>
