import generateTypes from './index.js';

const run = async () => {
	const config = await import(process.env.CONFIG_PATH || '../../../../config/rizom.config').then(
		(module) => module.default
	);
	generateTypes(config);
};

run();
