import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/errors/handler.server.js';
import type { PrototypeSlug } from '$lib/types/doc.js';
import { safe } from '$lib/util/safe.js';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;
		const data = await event.request.json();
		const { email, password } = data;

		const [error, success] = await safe(rizom.auth.login({ email, password, slug }));
		if (error) {
			return handleError(error, { context: 'api' });
		}

		const headers = { 'set-auth-token': success.token };
		return json({ user: success.user }, { headers });
	}

	return POST;
}
