<script lang="ts">
	import Button from '../button/button.svelte';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { usersFields } from '$lib/collection/auth/usersFields.js';
	import { getConfigContext } from 'rizom/panel/context/config.svelte';
	import { text } from 'rizom/fields/index.js';

	type Props = { create: boolean; form: DocumentFormContext };
	const { create, form }: Props = $props();

	let changingPassword = $state(create);

	function cancel() {
		changingPassword = false;
		delete form.errors.value.password;
		delete form.errors.value.passwordConfirm;
	}

	function submit() {
		form.element?.requestSubmit();
		changingPassword = false;
	}

	$effect(() => {
		if (form.doc.password !== form.doc.confirmPassword && changingPassword === true) {
			form.errors.set('__form', 'password mismatch');
		} else {
			form.errors.delete('__form');
		}
	});

	const config = getConfigContext();

	const Email = config.config.blueprints.email.component;
	const Text = config.config.blueprints.text.component;
</script>

<div class="rz-doc-auth-header">
	<Email {form} config={usersFields.email} path="email" />

	{#if changingPassword}
		<Text {form} type="password" config={text('password').required().toField()} path="password" />

		<Text {form} type="password" config={usersFields.confirmPassword} path="confirmPassword" />

		{#if !create && !form.readOnly}
			<div class="rz-doc-auth-header__buttons">
				<Button disabled={!form.canSubmit} type="submit" size="lg" onclick={submit}>
					Change password
				</Button>
				<Button size="lg" onclick={cancel} variant="secondary">Cancel</Button>
			</div>
		{/if}
	{/if}

	{#if !changingPassword && !form.readOnly}
		<div class="rz-doc-auth-header__buttons">
			<Button size="lg" onclick={() => (changingPassword = true)} variant="outline">
				Change Password
			</Button>
		</div>
	{/if}
</div>

<style type="postcss">
	.rz-doc-auth-header {
		background-color: hsl(var(--rz-ground-6));
		display: grid;
		gap: var(--rz-size-6);
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		padding: var(--rz-size-5);
	}
	.rz-doc-auth-header__buttons {
		display: flex;
		justify-content: start;
		gap: var(--rz-size-4);
	}
</style>
