import { error, json, type RequestEvent } from '@sveltejs/kit';

export default async function ({ request, locals }: RequestEvent) {
	const { rizom } = locals;

	if (!locals.session) {
		return error(401);
	}
	await rizom.auth.betterAuth.api.revokeSession({
		body: {
			token: locals.session.token
		},
		headers: request.headers
	});
	return json('successfully logout');
}
