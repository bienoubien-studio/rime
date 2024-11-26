<script lang="ts">
	import * as Card from 'rizom/panel/components/ui/card';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'rizom/panel/components/ui/sonner';
	import { Fields } from 'rizom/panel/components/fields';
	import validate from 'rizom/utils/validate';

	import type { FormErrors } from 'rizom/types';

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
				<Fields.Text config={{ name: 'name', type: 'text', required: true }} form={context} />
				<Fields.Email
					config={{
						name: 'email',
						type: 'email',
						validate: validate.email,
						required: true
					}}
					form={context}
				/>

				<Fields.Text
					type="password"
					config={{ name: 'password', type: 'text', required: true }}
					form={context}
				/>
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
