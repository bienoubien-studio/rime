import global from './global/load.server.js';
import { layoutLoad } from './collection-layout/load.server.js';
import { docLoad } from './collection-document/load.server.js';
import { forgotPasswordLoad as forgotPassword } from './forgot-password/load.server.js';
import { resetPasswordLoad as resetPassword } from './reset-password/load.server.js';
import { initLoad as init } from './init/load.server.js';
import { loginLoad as login } from './login/load.server.js';
import { liveLoad as live } from './live/load.server.js';
import { dashboardLoad as dashboard } from './dashboard/load.server.js';

const collection = {
	layout: layoutLoad,
	doc: docLoad
};

export { global, collection, dashboard, resetPassword, forgotPassword, live, init, login };

export default {
	global,
	collection,
	dashboard,
	resetPassword,
	forgotPassword,
	live,
	init,
	login
};
