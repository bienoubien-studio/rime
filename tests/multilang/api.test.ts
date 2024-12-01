import test, { expect } from '@playwright/test';
import { filePathToBase64 } from 'rizom/collection/upload/utils/converter';
import path from 'path';

const API_BASE_URL = 'http://local.rizom:5173/api';

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
	const response = await request
		.post(`${API_BASE_URL}/users/login`, {
			data: {
				email: 'admin@bienoubien.studio',
				password: 'a&1Aa&1A'
			}
		})
		.then((r) => r.json());
	expect(response.token).toBeDefined();
	expect(response.user).toBeDefined();
	expect(response.user.id).toBeDefined();
	expect(response.user.roles).toBeDefined();
	expect(response.user.roles[0]).toBe('admin');
	token = response.token;
	adminUserId = response.user.id;
});

///////////////////////////////////////////////
// Collection create / update / delete / read
//////////////////////////////////////////////

let homeId: string;
let pageId: string;

test('Should create Home', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Accueil',
			slug: 'accueil',
			home: true,
			author: [adminUserId]
		}
	});

	const { doc } = await response.json();
	expect(doc.title).toBe('Accueil');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	expect(doc.home).toBe(true);
	expect(doc.locale).toBeDefined();
	expect(doc.locale).toBe('fr');
	homeId = doc.id;
});

test('Should get Home EN with FR data', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}?locale=en`);
	const { doc } = await response.json();
	expect(doc.title).toBe('Accueil');
	expect(doc.locale).toBe('en');
	expect(doc.slug).toBe('accueil');
});

test('Should set Home title/slug EN to Home/home', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/pages/${homeId}?locale=en`, {
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
	expect(doc.locale).toBe('en');
	expect(doc.slug).toBe('home');
});

test('Should get Home FR with still FR data', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}?locale=fr`);
	const { doc } = await response.json();
	expect(doc.title).toBe('Accueil');
	expect(doc.slug).toBe('accueil');
});

test('Should get Home EN with EN data', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}?locale=en`);
	const { doc } = await response.json();
	expect(doc.title).toBe('Home');
	expect(doc.slug).toBe('home');
});

test('Should create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Page',
			slug: 'page',
			components: [
				{
					text: 'Foo',
					type: 'paragraph'
				},
				{
					type: 'image',
					legend: 'legend'
				}
			]
		}
	});
	const { doc } = await response.json();
	expect(doc.title).toBe('Page');
	expect(doc.locale).toBe('fr');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	expect(doc.components.length).toBe(2);
	expect(doc.components.at(0).text).toBe('Foo');
	expect(doc.components.at(1).legend).toBe('legend');
	pageId = doc.id;
});

test('Should return the home page', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}`).then((response) => {
		return response.json();
	});
	expect(response.doc).toBeDefined();
	expect(response.doc.title).toBe('Accueil');
});

test('Should return 2 pages', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
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

/** ---------------- QUERIES ---------------- */

test('Should return home EN (query)', async ({ request }) => {
	const url = `${API_BASE_URL}/pages?where[author][in_array]=${adminUserId}&locale=en`;
	const response = await request.get(url).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
	expect(response.docs[0].title).toBe('Home');
});

test('Should return home FR (query)', async ({ request }) => {
	const url = `${API_BASE_URL}/pages?where[author][in_array]=${adminUserId}`;
	const response = await request.get(url).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
	expect(response.docs[0].title).toBe('Accueil');
});

let pageWithAuthorId: string;
test('Should create an other page with author', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			title: 'Page 2',
			slug: 'page-2',
			author: adminUserId
		}
	});
	const { doc } = await response.json();
	expect(doc.title).toBe('Page 2');
	expect(doc.slug).toBe('page-2');
	expect(doc.locale).toBe('fr');
	expect(doc.id).toBeDefined();
	pageWithAuthorId = doc.id;
});

test('Should return last created page with author depth', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${pageWithAuthorId}?depth=1`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	const { doc } = await response.json();
	expect(doc.title).toBe('Page 2');
	expect(doc.slug).toBe('page-2');
	expect(doc.author).toBeDefined();
	expect(doc.author.at(0).name).toBe('Admin');
});

test('Should return Page 2 (query)', async ({ request }) => {
	const qs = `where[and][0][author][in_array]=${adminUserId}&where[and][1][slug][equals]=page-2&locale=en`;
	const url = `${API_BASE_URL}/pages?${qs}`;
	const response = await request.get(url).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
	expect(response.docs[0].title).toBe('Page 2');
	expect(response.docs[0].locale).toBe('en');
});

test('Should delete page', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/pages/${pageId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
});

test('Should return 2 page', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
});

//////////////////////////////////////////////
// AUTH Collection
//////////////////////////////////////////////

let editorId: string;

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
	const response = await request
		.post(`${API_BASE_URL}/users/login`, {
			data: {
				email: 'admin@bienoubien.studio',
				password: 'a&1Aa&1A'
			}
		})
		.then((r) => r.json());
	expect(response.token).toBeDefined();
	token = response.token;
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
			stickyHeader: true,
			legalMention: 'mentions légales'
		}
	});
	expect(response.status()).toBe(200);
	const { doc } = await response.json();
	expect(doc.legalMention).toBe('mentions légales');
});

test('Should update settings EN', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings?locale=en`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			legalMention: 'legals'
		}
	});
	expect(response.status()).toBe(200);
	const { doc } = await response.json();
	expect(doc.legalMention).toBe('legals');
});

test('Should get settings FR with still FR data', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings?locale=fr`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	expect(response.status()).toBe(200);
	const { doc } = await response.json();
	expect(doc.legalMention).toBe('mentions légales');
});

test('Should update infos', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/infos`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			instagram: '@fooo',
			legals: {
				label: 'Google',
				type: 'url',
				link: 'http://google.fr',
				target: '_self'
			}
		}
	});
	expect(response.status()).toBe(200);
	const { doc } = await response.json();
	expect(doc.legals).toBeDefined();
	expect(doc.legals.type).toBe('url');
	expect(doc.legals.link).toBe('http://google.fr');
});

test('Should update infos EN', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/infos?locale=en`, {
		headers: {
			Authorization: `Bearer ${token}`
		},
		data: {
			legals: {
				label: 'Google-en',
				type: 'url',
				link: 'http://google.com',
				target: '_blank'
			}
		}
	});
	expect(response.status()).toBe(200);
	const { doc } = await response.json();
	expect(doc.legals).toBeDefined();
	expect(doc.legals.label).toBe('Google-en');
	expect(doc.legals.link).toBe('http://google.com');
});

test('Should get infos FR', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos`).then((r) => r.json());
	expect(response.doc.legals).toBeDefined();
	expect(response.doc.legals.link).toBe('http://google.fr');
	expect(response.doc.legals.label).toBe('Google');
});

test('Should get infos EN', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos?locale=en`).then((r) => r.json());
	expect(response.doc.legals).toBeDefined();
	expect(response.doc.legals.link).toBe('http://google.com');
	expect(response.doc.legals.label).toBe('Google-en');
});

test('Should not get settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`);
	expect(response.status()).toBe(403);
});

test('Should get informations', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos`).then((r) => r.json());
	expect(response.doc.instagram).toBe('@fooo');
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
	const data = await response.json();
	expect(status).toBe(200);
	expect(data.token).toBeDefined();
	token = data.token;
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
