import { json, type RequestEvent } from '@sveltejs/kit';
import { handleAPIError } from 'rizom/api/handleError.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;
		const data = await event.request.json();
		const { email, password } = data;
		try {
			const { token, user } = await rizom.auth.login({ email, password, slug });
			const headers = token ? { 'set-auth-token': token } : undefined;
			return json({ user }, { headers });
		} catch (err) {
			handleAPIError(err, 'Could not login user');
		}
	}

	return POST;
}
