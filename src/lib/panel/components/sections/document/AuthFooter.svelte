<script lang="ts">
	import { t__ } from '$lib/core/i18n';
	import Button from '../../ui/button/button.svelte';
	import { authClient } from '$lib/panel/util/auth';
	import { toast } from 'svelte-sonner';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { getUserContext } from '$lib/panel/context/user.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import validate from '$lib/util/validate';
	import type { ClientField, TextField } from '$lib/fields/types.js';
	import type { CompiledCollection } from '$lib/core/config/types/index.js';
	import { isAuthConfig } from '$lib/util/config.js';
	
	type Props = { operation: string; form: DocumentFormContext; collection: CompiledCollection };
	const { operation, form, collection }: Props = $props();

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
			redirectTo: `/reset-password?slug=staff`
		});
		if (error && error.message) {
			toast.error(error.message);
		}
		if (data && data.status) {
			toast.success(t__('common.passwordResetLinkSent', form.doc.email));
		}
	}

	const Text = config.raw.blueprints.text.component;

	const passwordConfig: ClientField<TextField> = {
		name: 'password',
		type: 'text',
		placeholder: t__('fields.password'),
		required: true,
		isEmpty: (value) => !value,
		validate: validate.password,
		access: {
			create: () => true,
			read: () => true,
			update: () => true
		}
	};

	const confirmPasswordConfig: ClientField<TextField> = {
		name: 'confirmPassword',
		type: 'text',
		label: t__('common.confirmPassword'),
		placeholder: t__('common.confirmPassword'),
		required: true,
		isEmpty: (value) => !value,
		access: {
			create: () => true,
			read: () => true,
			update: () => true
		},
		validate: (value, metas) => {
			if (metas.data.password !== value) {
				return 'password_mismatch';
			}
			return true;
		}
	};
</script>

<div class="rz-document-auth">
	{#if operation === 'create'}
		{#if isAuthConfig(collection) && collection.auth.type === 'password'}
			<Text {form} type="password" config={passwordConfig} path="password" />
			<Text {form} type="password" config={confirmPasswordConfig} path="confirmPassword" />
		{/if}
	{:else if user.attributes.roles.includes('admin')}
		{#if isAuthConfig(collection) && collection.auth.type === 'password'}
			<div>
				<Button onclick={sendPasswordResetLink} variant="outline">
					{t__('common.sendPasswordResetLink')}
				</Button>
			</div>
		{/if}
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
