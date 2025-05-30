import test, { expect } from '@playwright/test';
import path from 'path';
import { filePathToBase64 } from 'rizom/core/collections/upload/util/converter.js';
import { PANEL_USERS } from 'rizom/core/constant';
import { clearLog, logToFile } from '../../src/log.js';

const BASE_URL = 'http://rizom.test:5173';
const API_BASE_URL = `${BASE_URL}/api`;

let superAdminId: string;
let superAdminToken: string;

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
/* Handling versioned areas without draft enabled 
/****************************************************/

let infoVersionId: string
let infosId: string
// get the 1st version
test('Should get infos', async ({ request }) => {
	clearLog()
	const response = await request.get(`${API_BASE_URL}/infos`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.doc).toBeDefined()
	expect(data.doc.title).toBe(null)
	expect(data.doc.versionId).toBeDefined()
	infoVersionId = data.doc.versionId
	infosId = data.doc.id
})

// update infos, this should create a new version
test('Should update infos (creating a new version)', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/infos`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			title: 'latest'
		}
	});

	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('latest')

	const verify = await request.get(`${API_BASE_URL}/infos`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(verify.status()).toBe(200);
	const verifyData = await verify.json()

	expect(verifyData.doc).toBeDefined()
	expect(verifyData.doc.id).toBe(infosId)
	expect(verifyData.doc.versionId).toBeDefined()
	expect(verifyData.doc.versionId).not.toBe(infoVersionId)
	expect(verifyData.doc.title).toBeDefined()
	expect(verifyData.doc.title).toBe('latest')
});

// Check if the first version hasn't been updated
test('Should get the first infos version', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos?versionId=${infoVersionId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.doc).toBeDefined()
	expect(data.doc.id).toBe(infosId)
	expect(data.doc.versionId).toBeDefined()
	expect(data.doc.versionId).toBe(infoVersionId)
	expect(data.doc.title).toBe(null)
});

// Update the first version created
test('Should update a specific infos version', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/infos?versionId=${infoVersionId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			title: 'newer than latest'
		}
	});
	expect(response.status()).toBe(200);
	// the latest should now be the first we've created
	const verify = await request.get(`${API_BASE_URL}/infos`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(verify.status()).toBe(200);
	const data = await verify.json()
	expect(data.doc).toBeDefined()
	expect(data.doc.versionId).toBeDefined()
	expect(data.doc.versionId).toBe(infoVersionId)
	expect(data.doc.title).toBe('newer than latest')
	expect(data.doc.id).toBe(infosId)
});

// check that we have 2 versions
test('Should return 2 versions of infos', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos_versions`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.docs).toBeDefined()
	expect(data.docs).toHaveLength(2)
	expect(data.docs.at(0).title).toBe('newer than latest')
	expect(data.docs.at(1).title).toBe('latest')
});

// check that we the version collection inherits from the area access
test('Should not return infos versions without credentials', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/infos_versions`);
	expect(response.status()).toBe(403);
});

/****************************************************/
/* Handling versioned areas with draft enabled 
/****************************************************/

let settingVersionId: string
let settingsId: string

// get the 1st version
test('Should get settings', async ({ request }) => {
	clearLog()
	const response = await request.get(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.doc).toBeDefined()
	expect(data.doc.title).toBe(null)
	expect(data.doc.versionId).toBeDefined()
	settingVersionId = data.doc.versionId
	settingsId = data.doc.id
})

// update settings, this should not create a new version
test('Should update the published settings', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			title: 'initial settings'
		}
	});

	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('initial settings')
	expect(responseData.doc.versionId).toBeDefined()
	expect(responseData.doc.versionId).toBe(settingVersionId)

	const verify = await request.get(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(verify.status()).toBe(200);
	const verifyData = await verify.json()

	expect(verifyData.doc).toBeDefined()
	expect(verifyData.doc.versionId).toBeDefined()
	expect(verifyData.doc.versionId).toBe(settingVersionId)
	expect(verifyData.doc.title).toBeDefined()
	expect(verifyData.doc.title).toBe('initial settings')
});

// update settings, this should create a new version
test('Should update the settings and create a second settings version', async ({ request }) => {
	const response = await request.post(`${API_BASE_URL}/settings?draft=true`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			title: 'second settings version'
		}
	});
	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('second settings version')
	expect(responseData.doc.status).toBe('draft')
	expect(responseData.doc.versionId).toBeDefined()
	expect(responseData.doc.versionId).not.toBe(settingVersionId)
})

test('Should get the published settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	})
	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('initial settings')
	expect(responseData.doc.status).toBe('published')
	expect(responseData.doc.versionId).toBe(settingVersionId)
})

// get latest draft settings and publish it
test('Should get the latest settings draft and publish it', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings?draft=true`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	})
	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('second settings version')
	expect(responseData.doc.status).toBe('draft')
	expect(responseData.doc.versionId).not.toBe(settingVersionId)

	const publishResponse = await request.post(`${API_BASE_URL}/settings?versionId=${responseData.doc.versionId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		},
		data: {
			status: 'published'
		}
	});
	
	expect(publishResponse.status()).toBe(200);
	const publishResponseData = await publishResponse.json()
	expect(publishResponseData.doc).toBeDefined()
	expect(publishResponseData.doc.title).toBe('second settings version')
	expect(publishResponseData.doc.status).toBe('published')
})

// The initially published document should now be a draft
test('Should get the initial settings as a draft', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings?versionId=${settingVersionId}`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	})
	expect(response.status()).toBe(200);
	const responseData = await response.json()
	expect(responseData.doc).toBeDefined()
	expect(responseData.doc.title).toBe('initial settings')
	expect(responseData.doc.status).toBe('draft')
})

// check that we have 2 versions
test('Should return 2 versions of settings', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings_versions`, {
		headers: {
			Authorization: `Bearer ${superAdminToken}`
		}
	});
	expect(response.status()).toBe(200);
	const data = await response.json()
	expect(data.docs).toBeDefined()
	expect(data.docs).toHaveLength(2)
	expect(data.docs.at(0).title).toBe('second settings version')
	expect(data.docs.at(0).status).toBe('published')
	expect(data.docs.at(1).title).toBe('initial settings')
	expect(data.docs.at(1).status).toBe('draft')
});

// check that we the version collection inherits from the area access
test('Should not return settings versions without credentials', async ({ request }) => {
	const response = await request.get(`${API_BASE_URL}/settings_versions`);
	expect(response.status()).toBe(403);
});
