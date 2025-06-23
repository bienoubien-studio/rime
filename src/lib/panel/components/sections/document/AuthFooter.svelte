<script lang="ts">
	import { t__ } from '$lib/core/i18n';
	import Button from '../../ui/button/button.svelte';
	import { authClient } from '$lib/panel/util/auth';
	import { toast } from 'svelte-sonner';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import { usersFields } from '$lib/core/collections/auth/config/usersFields';
	import { text } from '$lib/fields/text/index.js';
	import validate from '$lib/util/validate';
	import { PANEL_USERS } from '$lib/core/constant';

	type Props = { operation: string; form: DocumentFormContext };
	const { operation, form }: Props = $props();

	const user = getUserContext();
	const config = getConfigContext();

	$effect(() => {
		if (form.doc.password !== form.doc.confirmPassword && operation === 'create') {
			form.errors.set('__form', 'password_mismatch');
		} else {
			form.errors.delete('__form');
		}
	});

	async function sendPasswordResetLink() {
		const { data, error } = await authClient.forgetPassword({
			email: form.doc.email,
			redirectTo: `/reset-password?slug=${PANEL_USERS}`
		});
		if (error && error.message) {
			toast.error(error.message);
		}
		if (data && data.status) {
			toast.success(t__('common.passwordResetLinkSent', form.doc.email));
		}
	}

	const Text = config.raw.blueprints.text.component;
</script>

<div class="rz-document-auth">
	{#if operation === 'create'}
		<Text {form} type="password" config={text('password').validate(validate.password).required().raw} path="password" />
		<Text {form} type="password" config={usersFields.confirmPassword.raw} path="confirmPassword" />
	{:else if user.attributes.roles.includes('admin')}
		<div>
			<Button onclick={sendPasswordResetLink} variant="outline">
				{t__('common.sendPasswordResetLink')}
			</Button>
		</div>
	{/if}
</div>

<style>
	.rz-document-auth {
		display: grid;
		gap: var(--rz-size-6);

		& > :global(*) {
			padding: 0 var(--rz-fields-padding);
		}
	}
</style>
