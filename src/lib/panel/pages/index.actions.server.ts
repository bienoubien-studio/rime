import area from './area/actions.server.js';
import collectionDoc from './collection-document/actions.server.js';

import { initActions as init } from './init/actions.server.js';
import { loginActions as login } from './login/actions.server.js';
import { logoutActions as logout } from './logout/actions.server.js';

const collection = {
	doc: collectionDoc
};

export { area, collection, init, login, logout };

export default {
	area,
	collection,
	init,
	login,
	logout
};
