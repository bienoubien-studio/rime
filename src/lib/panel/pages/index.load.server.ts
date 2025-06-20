import area from './area/load.server.js';
import { collectionLoad } from './collection/load.server.js';
import { docLoad } from './collection-document/load.server.js';
import { forgotPasswordLoad as forgotPassword } from './forgot-password/load.server.js';
import { resetPasswordLoad as resetPassword } from './reset-password/load.server.js';
import { initLoad as init } from './init/load.server.js';
import { loginLoad as login } from './login/load.server.js';
import { liveLoad as live } from './live/load.server.js';
import { dashboardLoad as dashboard } from './dashboard/load.server.js';

const collection = {
	list: collectionLoad,
	doc: docLoad
};

export { area, collection, dashboard, resetPassword, forgotPassword, live, init, login };

export default {
	area,
	collection,
	dashboard,
	resetPassword,
	forgotPassword,
	live,
	init,
	login
};
