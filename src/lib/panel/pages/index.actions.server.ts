import global from './global/actions.server.js';
import collection from './collection-document/actions.server.js';
import { forgotPasswordActions as forgotPassword } from './forgot-password/actions.server.js';
import { initActions as init } from './init/actions.server.js';
import { resetPasswordActions as resetPassword } from './reset-password/actions.server.js';

export { global, collection, forgotPassword, init, resetPassword };

export default {
	global,
	collection,
	forgotPassword,
	resetPassword,
	init
};
