import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { PrototypeSlug } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/trycatch.js';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;
		const data = await event.request.json();
		const { email, password } = data;

		const [error, success] = await trycatch(rizom.auth.login({ email, password, slug }));
		if (error) {
			return handleError(error, { context: 'api' });
		}

		const headers = { 'set-auth-token': success.token };
		return json({ user: success.user }, { headers });
	}

	return POST;
}
