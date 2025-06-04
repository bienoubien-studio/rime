// See https://kit.svelte.dev/docs/types#app
import type { Navigation } from '$lib/panel/navigation.ts';
import type { Session } from 'better-auth';
import type { Rizom } from '$lib/types';
import type { Rizom } from '$lib/core/rizom.server';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CorePlugins } from '$lib/core/types/plugins.js';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
			rizom: Rizom;
			routes: Navigation;
			locale: string | undefined;
		}
	}
}

export {};
