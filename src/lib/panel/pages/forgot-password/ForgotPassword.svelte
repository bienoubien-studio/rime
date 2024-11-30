<script lang="ts">
	import * as Card from 'rizom/panel/components/ui/card';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { enhance } from '$app/forms';
	import validate from '$lib/utils/validate';
	import type { FormErrors } from 'rizom/types';

	type Props = { form?: { email?: string; errors?: FormErrors } };
	let { form }: Props = $props();

	const context = setFormContext(form || {}, 'forgot-password');

	import Email from 'rizom/fields/email/component/Email.svelte';
</script>

<div class="rz-forgot-password-container">
	{#if context.status === 'success'}
		<Card.Root>
			<Card.Header>
				<Card.Title>Email successfully sent</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					An email has been sent to {context.form.email} with instructions to reset your password
				</p>
			</Card.Content>
			<Card.Footer>
				<Button size="lg" href="/login">Login</Button>
			</Card.Footer>
		</Card.Root>
	{:else}
		<form method="POST" use:enhance={context.enhance}>
			<!--  -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Request a password reset</Card.Title>
				</Card.Header>
				<Card.Content>
					<Email
						form={context}
						config={{
							name: 'email',
							type: 'email',
							validate: validate.email,
							required: true
						}}
					/>
				</Card.Content>
				<Card.Footer>
					<Button type="submit" size="lg">Request a password reset</Button>
				</Card.Footer>
			</Card.Root>
			<!--  -->
		</form>
	{/if}
</div>

<style>
	.rz-forgot-password-container {
		display: grid;
		place-content: center;
		height: 100vh;
		width: 100vw;

		:global(.rz-card) {
			width: var(--rz-size-96);
		}
		:global(.rz-card-footer) {
			display: grid;
		}
	}
</style>
