// See https://kit.svelte.dev/docs/types#app
import type { User } from '$lib/core/collections/auth/types.js';
import type { Navigation } from '$lib/panel/navigation.ts';
import type { Rime } from '$lib/types.js';
import type { Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
			rime: Rime;
			routes: Navigation;
			locale: string | undefined;
		}
	}
}

export {};
