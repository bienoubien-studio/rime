import { env } from '$env/dynamic/public';
import { createAuthClient } from 'better-auth/svelte';

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
	baseURL: env.PUBLIC_RIZOM_URL
});
