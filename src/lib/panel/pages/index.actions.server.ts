import global from './global/actions.server.js';
import collection from './collection-document/actions.server.js';
import { forgotPasswordActions as forgotPassword } from './forgot-password/actions.server.js';
import { initActions as init } from './init/actions.server.js';
import { loginActions as login } from './login/actions.server.js';
import { resetPasswordActions as resetPassword } from './reset-password/actions.server.js';

export { global, collection, forgotPassword, init, resetPassword, login };

export default {
	global,
	collection,
	forgotPassword,
	resetPassword,
	init,
	login
};
