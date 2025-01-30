// See https://kit.svelte.dev/docs/types#app
import type { Navigation } from '$lib/panel/navigation.ts';
import type { Session } from 'better-auth';
import type { Rizom } from 'rizom';
import type { LocalAPI, User } from 'rizom/types/index.js';

declare global {
	//
	// type AtMostOne<T> = Explode<Partial<T>>;
	// type ExactlyOne<T> = AtMostOne<T> & AtLeastOne<T>;
	// type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

	namespace App {
		// interface Error {}

		interface Locals {
			session: Session;
			user: User | undefined;
			rizom: Rizom;
			api: LocalAPI;
			cache?: any;
			routes: Navigation;
			locale: string | undefined;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
