import { error, json, type RequestEvent } from '@sveltejs/kit';

export default async function ({ cookies, request, locals }: RequestEvent) {
	const { rizom } = locals;
	const authorizationHeader = request.headers.get('Authorization');
	const sessionId = rizom.auth.lucia.readBearerToken(authorizationHeader ?? '');
	if (!sessionId) {
		return error(401);
	}
	await rizom.auth.lucia.invalidateSession(sessionId);
	const sessionCookie = rizom.auth.lucia.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	return json('successfully logout');
}
