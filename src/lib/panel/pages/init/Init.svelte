<script lang="ts">
	import * as Card from 'rizom/panel/components/ui/card';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'rizom/panel/components/ui/sonner';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import type { FormErrors } from 'rizom/types';
	import { text } from 'rizom/fields';
	import { usersFields } from 'rizom/collection/auth/usersFields';

	type Props = { form?: { email?: string; password?: string; errors?: FormErrors } };
	let { form }: Props = $props();

	const context = setFormContext(form || {}, 'init');

	$effect(() => {
		if (context.status === 'failure') {
			toast.warning('Invalid credential');
		}
	});
</script>

<Toaster />
<div class="rz-init-container">
	<form method="POST" use:enhance={context.enhance}>
		<Card.Root>
			<Card.Header>
				<Card.Title>Create the first admin user</Card.Title>
			</Card.Header>
			<Card.Content>
				<Text config={text('name').required().toField()} form={context} />
				<Email config={usersFields.email.toField()} form={context} />
				<Text type="password" config={usersFields.password.toField()} form={context} />
			</Card.Content>
			<Card.Footer>
				<Button type="submit" size="lg">Create</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<style type="postcs">
	.rz-init-container {
		--rz-card-width: var(--rz-size-96);
		display: grid;
		place-content: center;
		height: 100vh;
		width: 100vw;
		& :global(.rz-card-footer) {
			display: grid;
		}
	}
</style>
