<script lang="ts">
	import { Toaster } from '$lib/panel/components/ui/sonner';
	import * as Card from '$lib/panel/components/ui/card';
	import { enhance } from '$app/forms';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import type { FormErrors } from 'rizom/types';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import { toast } from 'svelte-sonner';
	import { usersFields } from 'rizom/collection/auth/usersFields';

	interface Props {
		userId: string;
		token: string;
		slug: string;
		form?: { errors?: FormErrors };
	}

	const { userId, token, slug, form }: Props = $props();

	const context = setFormContext(form || {}, 'reset-password');

	$effect(() => {
		if (context.status === 'failure') {
			toast.warning(context.errors.first || 'An error occured');
		}
	});

	const validateConfirm = (value: unknown) => {
		if (value === context.form.password) return true;
		return 'Password missmatch';
	};
</script>

<Toaster />
<div class="rz-reset-password-container">
	<form method="POST" use:enhance={context.enhance}>
		<Card.Root>
			<Card.Header>
				<Card.Title>Reset password</Card.Title>
			</Card.Header>
			<Card.Content>
				<Text type="password" config={usersFields.password.raw} form={context} />
				<Text
					type="password"
					config={{ ...usersFields.password.raw, validate: validateConfirm }}
					form={context}
				/>
			</Card.Content>
			<Card.Footer>
				<Button
					size="lg"
					disabled={!(context.canSubmit && context.form.password && context.form.confirmPassword)}
					type="submit">Submit</Button
				>
			</Card.Footer>
		</Card.Root>
		<input type="hidden" name="userId" value={userId} />
		<input type="hidden" name="token" value={token} />
		<input type="hidden" name="slug" value={slug} />
	</form>
</div>

<style type="postcss">
	.rz-reset-password-container {
		display: flex;
		height: 100vh;
		width: 100vw;
		align-items: center;
		justify-content: center;

		:global(.rz-card) {
			width: var(--rz-size-80);
		}

		:global(.rz-card-footer) {
			display: grid;
		}
	}
</style>
