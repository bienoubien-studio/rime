import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import { extractData } from 'rizom/operations/data.server.js';

const apiInit: RequestHandler = async (event: RequestEvent) => {
	try {
		const { email, password, name } = await extractData(event.request);
		await event.locals.api.createFirstPanelUser({ email, password, name });
		return json({ initialized: true });
	} catch (err: any) {
		throw handleError(err, { context: 'api' });
	}
};

export default apiInit;
