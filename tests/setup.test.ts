import test, { expect } from '@playwright/test';
import { execSync } from 'node:child_process';

const BASE_URL = 'http://rizom.test:5173';
const API_BASE_URL = `${BASE_URL}/api`;

execSync('rm -fr ./app.md');

test('First init should work', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/init`, {
		data: {
			email: 'admin@bienoubien.studio',
			name: 'Admin',
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
});
