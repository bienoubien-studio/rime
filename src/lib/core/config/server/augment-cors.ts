import type { Config } from '$lib/core/config/types.js';
import { hasProp } from '$lib/util/object';

export type WithCORS<T> = T & { $trustedOrigins: string[] };

export const augmentCORS = <const T extends Config>(config: T): WithCORS<T> => {
	const trustedOrigins =
		hasProp('$trustedOrigins', config) && Array.isArray(config.$trustedOrigins)
			? config.$trustedOrigins
			: [process.env.PUBLIC_RIME_URL as string];

	return { ...config, $trustedOrigins: trustedOrigins } as const;
};
