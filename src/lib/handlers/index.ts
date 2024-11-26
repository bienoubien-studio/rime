import { handleAuth } from './auth.server.js';
import { handleCMS } from './rizom.server.js';
import { handleCORS } from './cors.server.js';
import { handleRoutes } from './routes.server.js';

export default [handleCMS, handleAuth, handleCORS, handleRoutes];
