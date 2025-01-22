export const expressServer = `import { handler } from './build/handler.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from static/medias
app.use('/medias', express.static(path.join(__dirname, 'static/medias')));

// SvelteKit handler
app.use(handler);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});`;
