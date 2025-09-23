declare module 'rizom:core' {
	export * from '$lib/core/config/server/index.server.js';
}

declare module 'rizom:config' {
	import config from '$lib/config.generated/rizom.config.server.js';
	export default config;
}

declare module 'rizom:config-client' {
	import config from '$lib/config.generated/rizom.config.js';
	export default config;
}
