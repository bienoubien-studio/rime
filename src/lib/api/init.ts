import { RizomInitError } from '$lib/errors/init.server';
import extractData from '$lib/operations/preprocess/extract/data.server.js';
import { error, json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { validate } from 'rizom/utils';
import logger from '../logger/index.js';

const apiInit: RequestHandler = async (event: RequestEvent) => {
	const { rizom } = event.locals;

	let data;
	try {
		data = await extractData(event.request);
	} catch (err: any) {
		console.log(err);
		error(400, 'invalid data');
	}

	const { email, password, name } = data;

	if (!email) {
		return error(400, 'email is required');
	}

	const isValidEmail = validate.email(email);
	if (typeof isValidEmail === 'string') {
		return error(400, isValidEmail);
	}

	if (!name) {
		return error(400, 'name is required');
	}

	const isValidPassword = validate.password(password);
	if (typeof isValidPassword === 'string') {
		return error(400, isValidPassword);
	}

	try {
		await rizom.auth.createFirstUser({ name, email, password });
		return json({ initialized: true });
	} catch (err: any) {
		logger.error(err);
		if (err instanceof RizomInitError) {
			return error(404);
		}
		return error(500);
	}
};

export default apiInit;
