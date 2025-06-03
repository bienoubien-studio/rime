import test, { expect } from '@playwright/test';
import path from 'path';
import { filePathToBase64 } from 'rizom/core/collections/upload/util/converter.js';
import { PANEL_USERS } from 'rizom/core/constant';

const BASE_URL = process.env.PUBLIC_RIZOM_URL;
const API_BASE_URL = `${BASE_URL}/api`;

let editorId: string;
let editorToken: string;
let editor2Id: string;
let adminId: string;
let adminToken: string;
let superAdminId: string;
let superAdminToken: string;

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

test('Login should not be successfull', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'admin@bienoubien.studio',
			password: '12345678'
		}
	});
	expect(response.status()).toBe(400);
});

test('Superadmin login should be successfull', async ({ request }) => {
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
	superAdminToken = headerToken;
	superAdminId = json.user.id;
});

/****************************************************/
/* Collection create / update / delete / read
/****************************************************/

let homeId: string;
let pageId: string;

test('Should not create Page with missing required title', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {}
	});
	expect(response.status()).toBe(400);
});

test('Should create Home', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			attributes: {
				title: 'Home',
				slug: 'home'
			}
		}
	});

	const { doc } = await response.json();
	expect(doc.attributes.title).toBe('Home');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	homeId = doc.id;
});

test('Should create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			attributes: {
				title: 'Page',
				slug: 'page',
				template: 'basic'
			},
			parent: homeId,
		}
	});
	const { doc } = await response.json();
	expect(doc.attributes.title).toBe('Page');
	expect(doc.createdAt).toBeDefined();
	expect(doc.id).toBeDefined();
	expect(doc.parent.at(0).documentId).toBe(homeId);
	expect(doc.attributes.template).toBe('basic');
	pageId = doc.id;
});

test('Should return the home page', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages/${homeId}`).then((response) => {
		return response.json();
	});
	
	expect(response.doc).toBeDefined();
	expect(response.doc.attributes.title).toBe('Home');
});

test('Should return 2 pages', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
});

/** ---------------- SELECT ---------------- */

test('Should return 2 pages with only attributes.slug and id prop', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages?select=attributes.slug`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
	expect(response.docs[0].id).toBeDefined();
	expect(response.docs[0].attributes.slug).toBeDefined();
	expect(response.docs[0].attributes.title).toBeUndefined();
	expect(response.docs[0].attributes.template).toBeUndefined();
	expect(response.docs[0].parent).toBeUndefined();
	expect(response.docs[1].id).toBeDefined();
	expect(response.docs[1].attributes.slug).toBeDefined();
	expect(response.docs[1].attributes.title).toBeUndefined();
	expect(response.docs[1].attributes.template).toBeUndefined();
	expect(response.docs[1].parent).toBeUndefined();
});

test('Should return 2 pages with only attributes slug, title and id prop', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/pages?select=attributes.slug,attributes.title`).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(2);
	expect(response.docs[0].id).toBeDefined();
	expect(response.docs[0].attributes.slug).toBeDefined();
	expect(response.docs[0].attributes.title).toBeDefined();
	expect(response.docs[0].attributes.template).toBeUndefined();
	expect(response.docs[0].parent).toBeUndefined();
	expect(response.docs[1].id).toBeDefined();
	expect(response.docs[1].attributes.slug).toBeDefined();
	expect(response.docs[1].attributes.title).toBeDefined();
	expect(response.docs[1].attributes.template).toBeUndefined();
	expect(response.docs[1].parent).toBeUndefined();
});

test('Should return page (query)', async ({ request }) => {
	const url = `${API_BASE_URL}/pages?where[parent][in_array]=${homeId}`;
	const response = await request.get(url).then((response) => {
		return response.json();
	});
	expect(response.docs).toBeDefined();
	expect(response.docs.length).toBe(1);
	expect(response.docs[0].attributes.title).toBe('Page');
});

test('Should delete page', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/pages/${pageId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
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

/****************************************************/
/* Offset / Limit
/****************************************************/

test('Should get correct offset / limit', async ({ request }) => {
	const headers = {
		Authorization: `Bearer ${superAdminToken}`
	}

	// Delete home for test // recreate at the end
	await request.delete(`${API_BASE_URL}/pages/${homeId}`, { headers });

	// Create 100 pages 
	for(let i = 1; i < 100; i++){
		await request.post(`${API_BASE_URL}/pages`, {
			headers,
			data: {
				attributes: {
					title: 'Page ' + i.toString().padStart(3, '0'),
					slug: 'page-' + i.toString().padStart(3, '0'),
				}
			}
		});
	}
	
	// Check findAll
	for(let i = 1; i < 10; i++){
		const pagination = i
		const offset = (pagination - 1) * 10
		const response = await request.get(`${API_BASE_URL}/pages?limit=10&offset=${offset}&sort=attributes.title`).then((response) => {
			return response.json();
		});
		expect(response.docs).toBeDefined();
		expect(response.docs.length).toBe(10);
		expect(response.docs.at(0).title).toBe('Page ' + (offset + 1).toString().padStart(3, '0'));
		expect(response.docs.at(9).title).toBe('Page ' + (offset + 10).toString().padStart(3, '0'));
	}

	// Create 100 other pages 
	for(let i = 1; i < 100; i++){
		const { doc } = await request.post(`${API_BASE_URL}/pages`, {
			headers,
			data: {
				attributes: {
					title: 'Other ' + i.toString().padStart(3, '0'),
					slug: 'other-' + i.toString().padStart(3, '0'),
				}
			}
		}).then(r => r.json());
		
		await request.patch(`${API_BASE_URL}/pages/${doc.id}`, {
			headers,
			data: {
				createdAt: new Date(new Date('2025-05-22T06:58:35.000Z').getTime() + (i * 1000))
			}
		});

	}

	// Check with query
	for(let i = 1; i < 10; i++){
		const pagination = i
		const offset = (pagination - 1) * 10
		const response = await request.get(`${API_BASE_URL}/pages?where[attributes.slug][like]=other-&limit=10&offset=${offset}&sort=createdAt`).then((response) => {
			return response.json();
		});
		expect(response.docs).toBeDefined();
		expect(response.docs.length).toBe(10);
		expect(response.docs.at(0).title).toBe('Other ' + (offset + 1).toString().padStart(3, '0'));
		expect(response.docs.at(9).title).toBe('Other ' + (offset + 10).toString().padStart(3, '0'));
	}

	// Re-create home
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers,
		data: {
			attributes: {
				title: 'Home',
				slug: 'home'
			}
		}
	});

	const { doc } = await response.json();
	homeId = doc.id;

});


/****************************************************/
/* Upload Collection
/****************************************************/

test('Should create a Media', async ({ request }) => {
	const base64 = await filePathToBase64(path.resolve(process.cwd(), 'tests/basic/landscape.jpg'));
	const response = await request.post(`${API_BASE_URL}/medias`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
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

/****************************************************/
/* AUTH Collection
/****************************************************/

test('Should not get users', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/${PANEL_USERS}`);
	expect(response.status()).toBe(403);
});

test('SuperAdmin sould not delete himself', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(403);
});

test('SuperAdmin sould not change isSuperAdmin', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			isSuperAdmin: false
		}
	});
	expect(response.status()).toBe(403);
});

test('Should get super admin user', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBe(superAdminId);
	expect(data.doc.roles).toContain('admin');
	expect(data.doc.name).toBe('Admin');
	expect(data.doc.isSuperAdmin).toBeUndefined();
	expect(data.doc.locked).toBeUndefined();
	expect(data.doc.lockedAt).toBeUndefined();
	expect(data.doc.loginAttempts).toBeUndefined();
});

test('Should create a user editor', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
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

test('Should create a 2nd user editor', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			email: 'editor2@bienoubien.com',
			name: 'Chesster',
			roles: ['editor'],
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBeDefined();
	editor2Id = data.doc.id;
});

test('Should create another admin', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			email: 'admin2@bienoubien.com',
			name: 'Admin2',
			roles: ['admin'],
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBeDefined();
	adminId = data.doc.id;
});

test('Should get editor user', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/${PANEL_USERS}/${editorId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc).toBeDefined();
	expect(data.doc.id).toBe(editorId);
	expect(data.doc.roles).toContain('editor');
	expect(data.doc.roles).not.toContain('admin');
	expect(data.doc.name).toBe('Chesster');
	expect(data.doc.locked).toBeUndefined();
	expect(data.doc.lockedAt).toBeUndefined();
	expect(data.doc.loginAttempts).toBeUndefined();
});

test('Should logout super admin', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/${PANEL_USERS}/logout`, {
			headers: {
				Authorization: `Bearer ${superAdminToken}`
			}
		})
		.then((r) => r.json());

	expect(response).toBe('successfully logout');
});

test('Should not update Home', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			attributes: {
				title: 'Accueil',
				slug: 'accueil'
			}
		}
	});
	expect(response.status()).toBe(403);
});

test('Should not delete home', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(403);
});

test('Should not create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			attributes: {
				title: 'Page 3',
				slug: 'page-3'
			}
		}
	});
	expect(response.status()).toBe(403);
});

test('Should not update area', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			maintenance: true
		}
	});
	expect(response.status()).toBe(403);
});

test('Admin login should be successfull', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'admin2@bienoubien.com',
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200)
	const headerToken = response.headers()['set-auth-token'];
	const json = await response.json();
	expect(headerToken).toBeDefined();
	expect(json.user).toBeDefined();
	expect(json.user.id).toBeDefined();
	adminToken = headerToken;
	adminId = json.user.id;
});

test('Admin should not delete superAdmin', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		},
	});
	expect(response.status()).toBe(403);
});

let editor3Id: string
test('Admin should create a user', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		},
		data: {
			email: 'editor3@foo.com',
			name: 'editor3',
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	editor3Id = data.doc.id
});

test('Default role should be editor', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/${PANEL_USERS}/${editor3Id}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.doc.roles.includes('admin')).toBe(false)
	expect(data.doc.roles.includes('editor')).toBe(true)
});

test('Admin should not create an admin with isSuperAdmin', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		},
		data: {
			email: 'admin2@foo.com',
			name: 'admin2',
			roles: ['admin'],
			password: 'a&1Aa&1A',
			isSuperAdmin: true,
		}
	});
	expect(response.status()).toBe(403);
});

test('Admin should not update isSuperAdmin', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		},
		data: {
			isSuperAdmin: false
		}
	});
	expect(response.status()).toBe(403);
});

test('Admin should not change superAdmin roles', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${adminToken}`
		},
		data: {
			roles: ['editor']
		}
	});
	expect(response.status()).toBe(403);
});

/****************************************************/
/* Area
/****************************************************/

test('SuperAdmin login should be successfull (again)', async ({ request }) => {
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
	superAdminToken = headerToken;
});

test('Should get settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
});

test('Should update settings', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
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
				Authorization: `Bearer ${superAdminToken}`
			}
		})
		.then((r) => r.json());
	expect(response.doc.maintenance).toBe(true);
});

test('Should not get settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`);
	expect(response.status()).toBe(403);
});

/** SELECT */

test('Should get settings with only id and maintenance', async ({ request }) => {
	const response = await request
		.get(`${API_BASE_URL}/settings?select=maintenance`, {
			headers: {
				Authorization: `Bearer ${superAdminToken}`
			}
		})
		.then((r) => r.json());
	expect(response.doc.maintenance).toBe(true);
	expect(response.doc.id).toBeDefined();
	expect(Object.keys(response.doc).length).toBe(2)
});

/****************************************************/
/* Editor access
/****************************************************/

test('Should not logout admin user', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/${PANEL_USERS}/logout`)
	expect(response.status()).toBe(401);
});

test('Should login editor', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'editor@bienoubien.com',
			password: 'a&1Aa&1A'
		}
	});

	const status = response.status();
	expect(status).toBe(200);

	const headerToken = response.headers()['set-auth-token'];
	expect(headerToken).toBeDefined();
	editorToken = headerToken;
});

test('Editor should not change its roles', async ({ request }) => {
	await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${editorId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			roles: ['admin'],
		}
	});

	const verification = await request.get(`${API_BASE_URL}/${PANEL_USERS}/${editorId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	})

	const data = await verification.json()
	expect(data.doc.roles.includes('admin')).toBe(false)
	expect(data.doc.roles.includes('editor')).toBe(true)
});

test('Editor should not create a user', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			email: 'admin-by-editor@bienoubien.com',
			name: 'Admin',
			roles: ['admin'],
			password: 'a&1Aa&1A'
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not create a page', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/pages`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			attributes: {
				title: 'Page that will not be created',
				slug: 'page-that-will-not-be-created'
			}
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should update home', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/pages/${homeId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			attributes: {
				title: 'Home edited by editor'
			}
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json();
	expect(data.doc.title).toBe('Home edited by editor');
});

test('Editor should not delete superadmin', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not delete admin', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${adminId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not delete other editors', async ({ request }) => {
	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${editor2Id}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not update admin', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${adminId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			roles: ['editor']
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not update superadmin', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${superAdminId}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			roles: ['editor']
		}
	});
	expect(response.status()).toBe(403);
});

test('Editor should not update other editors', async ({ request }) => {
	const response = await request.patch(`${API_BASE_URL}/${PANEL_USERS}/${editor2Id}`, {
		headers: {
			Authorization: `Bearer ${editorToken}`
		},
		data: {
			roles: ['editor']
		}
	});
	expect(response.status()).toBe(403);
});


/****************************************************/
/* Auth Lock
/****************************************************/

test('Should not logout editor', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/${PANEL_USERS}/logout`)
	expect(response.status()).toBe(401);
});

test('Should logout editor', async ({ request }) => {
	const response = await request
		.post(`${API_BASE_URL}/${PANEL_USERS}/logout`, {
			headers: {
				Authorization: `Bearer ${editorToken}`
			}
		})
		.then((r) => r.json());

	expect(response).toBe('successfully logout');
});

test('Should lock user', async ({ request }) => {
	for (let i = 0; i < 4; i++) {
		const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
			data: {
				email: 'editor@bienoubien.com',
				password: 'fooooooooooo'
			}
		});
		expect(response.status()).toBe(400);
	}

	const response = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'editor@bienoubien.com',
			password: 'fooooooooooo'
		}
	});
	expect(response.status()).toBe(403);
});

test('Admin should delete user editor', async ({ request }) => {
	const signin = await request.post(`${API_BASE_URL}/${PANEL_USERS}/login`, {
		data: {
			email: 'admin@bienoubien.studio',
			password: 'a&1Aa&1A'
		}
	});
	const authToken = signin.headers()['set-auth-token'];
	expect(authToken).toBeDefined();

	const response = await request.delete(`${API_BASE_URL}/${PANEL_USERS}/${editorId}`, {
		headers: {
			Authorization: `Bearer ${authToken}`
		}
	});
	expect(response.status()).toBe(200);
});
