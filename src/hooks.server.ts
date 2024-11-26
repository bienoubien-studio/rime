import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '$lib/index.js';
import { rizom } from '$lib/index.js';

const init = async () => {
	await rizom.init();
};

init();

export const handle = sequence(...handlers);
