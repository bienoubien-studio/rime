export const expressServer = `import polka from 'polka';
import serveStatic from 'serve-static';
import { handler } from './build/handler.js';

const serve = serveStatic('./static');

polka()
	.use(serve)
	.use(handler)
	.listen(3000, () => {
		console.log("server running");
	});
`;
