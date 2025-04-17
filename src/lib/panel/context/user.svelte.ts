import type { User } from '$lib/types/auth';
import { getContext, setContext } from 'svelte';

function createUserStore(initial: User) {
	const user = $state.raw(initial);

	return {
		get attributes() {
			return user;
		}
	};
}

const CONFIG_KEY = Symbol('rizom.user');

export function setUserContext(initial: User) {
	const user = createUserStore(initial);
	return setContext(CONFIG_KEY, user);
}

export function getUserContext() {
	return getContext<ReturnType<typeof setUserContext>>(CONFIG_KEY);
}
