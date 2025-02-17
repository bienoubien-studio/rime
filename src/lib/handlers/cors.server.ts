import { error, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { RizomError } from 'rizom/errors';

export const handleCORS: Handle = async ({ event, resolve }) => {
	const { rizom } = event.locals;

	const trustedOrigin = [...(rizom.config.raw.trustedOrigins || [])];

	let cors;
	const origin = event.request.headers.get('origin');

	if (origin) {
		try {
			if (trustedOrigin.includes(origin)) {
				cors = origin;
			}
		} catch (err: any) {
			console.log(err);
			console.log(err.message);
			console.log('Invalid origin');
		}
	}

	if (event.url.pathname.startsWith('/api')) {
		if (event.request.method === 'OPTIONS' && cors) {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': cors,
					'Access-Control-Allow-Headers': '*'
				}
			});
		}
	}

	const response = await resolve(event);

	if (event.url.pathname.startsWith('/api')) {
		if (cors) {
			response.headers.append('Access-Control-Allow-Origin', cors);
		} else {
			throw error(401, RizomError.UNAUTHORIZED);
		}
	}

	return response;
};
