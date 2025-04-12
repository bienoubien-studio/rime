import type { GetRegisterType } from "rizom";

export type LinkType = 'url' | 'email' | 'tel' | 'anchor' | GetRegisterType<'PrototypeSlug'>;
export type Link = {
	type: LinkType;
	value: string | null;
	target: string;
	url?: string;
};
