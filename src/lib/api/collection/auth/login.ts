import { json, type RequestEvent } from '@sveltejs/kit';
import { handleAPIError } from 'rizom/api/handleError';
import type { PrototypeSlug } from 'rizom/types/doc';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;
		const data = await event.request.json();
		const { email, password } = data;
		try {
			const { session, user } = await rizom.auth.login({ email, password, slug });
			return json({
				token: session.id,
				user
			});
		} catch (err) {
			handleAPIError(err, 'Could not login user');
		}
	}

	return POST;
}
