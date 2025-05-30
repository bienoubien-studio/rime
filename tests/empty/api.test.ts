import test, { expect } from '@playwright/test';
import { PANEL_USERS } from 'rizom/core/constant';

const BASE_URL = 'http://rizom.test:5173';
const API_BASE_URL = `${BASE_URL}/api`;

let token: string;

/****************************************************/
/* Init
/****************************************************/

test('Second init should return 404', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/init`, {
		data: {
			email: 'admin@bienoubien.studio',
			name: 'Admin',
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(404);
});

/****************************************************/
/* Login
/****************************************************/

let adminUserId: string;

test('Login should be successfull', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'admin@bienoubien.studio',
			password: 'a&1Aa&1A'
		}
	});
	const headerToken = response.headers()['set-auth-token'];
	const json = await response.json();
	expect(headerToken).toBeDefined();
	expect(json.user).toBeDefined();
	expect(json.user.id).toBeDefined();
	expect(json.user.roles).toBeDefined();
	expect(json.user.roles[0]).toBe('admin');
	token = headerToken;
	adminUserId = json.user.id;
});