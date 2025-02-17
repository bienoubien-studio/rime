import test, { expect } from '@playwright/test';
import path from 'path';
import { filePathToBase64 } from 'rizom/collection/upload/utils/converter';

const BASE_URL = 'http://rizom.test:5173';
const API_BASE_URL = `${BASE_URL}/api`;

let token: string;

//////////////////////////////////////////////
// Init
//////////////////////////////////////////////

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

//////////////////////////////////////////////
// Login
//////////////////////////////////////////////

let adminUserId: string;

test('Login should not be successfull', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/users/login`, {
		data: {
			email: 'admin@bienoubien.studio',
			password: '12345678'
		}
	});
	expect(response.status()).toBe(400);
});

test('Login should be successfull', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/users/login`, {
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

///////////////////////////////////////////////
// Collection create / update / delete / read
//////////////////////////////////////////////

let homeId: string;
let pageId: string;

test('Should not create Page with missing required title', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {}
	});
	expect(response.status()).toBe(400);
});

test('Should create Home', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Home',
			slug: 'home'
		}
	});

	const { doc } = await response.json();
	expect(doc.title).toBe('Home');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	homeId = doc.id;
});

test('Should create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Page',
			slug: 'page',
			parent: homeId
		}
	});
	const { doc } = await response.json();
	expect(doc.title).toBe('Page');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	expect(doc.parent.at(0).relationId).toBe(homeId);
	pageId = doc.id;
});

test('Should return the home page', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}`).then((response) => {
		return response.json();
	});

	expect(response.doc).toBeDefined();
	expect(response.doc.title).toBe('Home');
});

test('Should return 2 pages', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
});

/** ---------------- QUERIES ---------------- */

test('Should return page (query)', async ({ request }) => {
	const url = `${API_BASE_URL}/pages?where[parent][in_array]=${homeId}`;
	const response = await request.get(url).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
	expect(response.docs[0].title).toBe('Page');
});

test('Should delete page', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/pages/${pageId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
});

test('Should return 1 page', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
});

//////////////////////////////////////////////
// Upload Collection
//////////////////////////////////////////////

test('Should create a Media', async ({ request }) => {
	const base64 = await filePathToBase64(path.resolve(process.cwd(), 'tests/basic/landscape.jpg'));
	const response = await request.post(`${API_BASE_URL}/medias`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			file: { base64, filename: 'Land$scape -3.JPG' },
			alt: 'alt'
		}
	});
	const status = response.status();
	expect(status).toBe(200);
	const { doc } = await response.json();
	expect(doc).toBeDefined();
	expect(doc.alt).toBe('alt');
	expect(doc.filename).toBe('landscape-3.jpg');
	expect(doc.mimeType).toBe('image/jpeg');
});

//////////////////////////////////////////////
// AUTH Collection
//////////////////////////////////////////////

let editorId: string;

test('Should get admin user', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/users/${adminUserId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBe(adminUserId);
	expect(data.doc.roles).toContain('admin');
	expect(data.doc.name).toBe('Admin');
	expect(data.doc.resetToken).toBeUndefined();
	expect(data.doc.resetTokenExpireAt).toBeUndefined();
	expect(data.doc.locked).toBeUndefined();
	expect(data.doc.lockedAt).toBeUndefined();
	expect(data.doc.loginAttempts).toBeUndefined();
	// expect(data.doc.hashedPassword).toBeUndefined();
});

test('Should create a user editor', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/users`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			email: 'editor@bienoubien.com',
			name: 'Chesster',
			roles: ['editor'],
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBeDefined();
	editorId = data.doc.id;
});

test('Should get editor user', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/users/${editorId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBe(editorId);
	expect(data.doc.roles).toContain('editor');
	expect(data.doc.roles).not.toContain('admin');
	expect(data.doc.name).toBe('Chesster');
	expect(data.doc.resetToken).toBeUndefined();
	expect(data.doc.resetTokenExpireAt).toBeUndefined();
	expect(data.doc.locked).toBeUndefined();
	expect(data.doc.lockedAt).toBeUndefined();
	expect(data.doc.loginAttempts).toBeUndefined();
	// expect(data.doc.hashedPassword).toBeUndefined();
});

test('Should logout user', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/users/logout`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
		.then((r) => r.json());

	expect(response).toBe('successfully logout');
});

test('Should not update Home', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Accueil',
			slug: 'accueil'
		}
	});
	expect(response.status()).toBe(403);
});

test('Should not delete home', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(403);
});

test('Should not create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Page 3',
			slug: 'page-3'
		}
	});
	expect(response.status()).toBe(403);
});

//////////////////////////////////////////////
// Global
//////////////////////////////////////////////

test('Login should be successfull (again)', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/users/login`, {
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
	token = headerToken;
	adminUserId = json.user.id;
});

test('Should get settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
});

test('Should update settings', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			maintenance: true
		}
	});
	expect(response.status()).toBe(200);
});

test('Should get the updated settings', async ({ request }) => {
	const response = await request
		.get(`${API_BASE_URL}/settings`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
		.then((r) => r.json());
	expect(response.doc.maintenance).toBe(true);
});

test('Should not get settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`);
	expect(response.status()).toBe(403);
});

//////////////////////////////////////////////
// Editor access
//////////////////////////////////////////////

test('Should logout admin user', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/users/logout`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
		.then((r) => r.json());

	expect(response).toBe('successfully logout');
});

test('Should login editor', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/users/login`, {
		data: {
			email: 'editor@bienoubien.com',
			password: 'a&1Aa&1A'
		}
	});

	const status = response.status();
	expect(status).toBe(200);

	const headerToken = response.headers()['set-auth-token'];
	expect(headerToken).toBeDefined();
	token = headerToken;
});

test('Editor should update editor password', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/users/${editorId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
});

test('Editor should not update admin password', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/users/${adminUserId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Page that will not be created',
			slug: 'page-that-will-not-be-created'
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should update home', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Home edited by editor'
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc.title).toBe('Home edited by editor');
});

//////////////////////////////////////////////
// Auth Lock
//////////////////////////////////////////////

test('Should logout editor', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/users/logout`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
		.then((r) => r.json());

	expect(response).toBe('successfully logout');
});

test('Should lock user', async ({ request }) => {
	for (let i = 0; i < 4; i++) {
		const response = await request.post(`${API_BASE_URL}/users/login`, {
			data: {
				email: 'editor@bienoubien.com',
				password: 'fooooooooooo'
			}
		});
		expect(response.status()).toBe(400);
	}

	const response = await request.post(`${API_BASE_URL}/users/login`, {
		data: {
			email: 'editor@bienoubien.com',
			password: 'fooooooooooo'
		}
	});
	expect(response.status()).toBe(403);
});

test('Should delete user editor', async ({ request }) => {
	const signin = await request.post(`${API_BASE_URL}/users/login`, {
		data: {
			email: 'admin@bienoubien.studio',
			password: 'a&1Aa&1A'
		}
	});
	const authToken = signin.headers()['set-auth-token'];
	const data = await signin.json();
	expect(authToken).toBeDefined();

	const response = await request.delete(`${API_BASE_URL}/users/${editorId}`, {
		headers: {
			Authorization: `Bearer ${authToken}`
		}
	});
	expect(response.status()).toBe(200);
});
