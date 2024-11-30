import type { ConfigMap } from '../preprocess/config/map.js';
import { isLinkField, isRichTextField } from '../../utils/field.js';
import rizom from '$lib/rizom.server.js';
import type { User } from 'rizom/types/auth.js';
import type { Link, LinkType } from 'rizom/fields/link/index.js';
import type { GetRegisterType } from 'rizom/types/register';
import type { LocalAPI } from 'rizom/types/api';
import type { Dic } from 'rizom/types/utility.js';

export const postprocessFields: FilterFieldsArgs = async ({
	flatDoc,
	configMap,
	user,
	api,
	locale
}) => {
	for (const [key, config] of Object.entries(configMap)) {
		//
		if (config.access && config.access.read) {
			const authorized = config.access.read(user);
			if (!authorized) {
				delete flatDoc[key];
			}
		}

		// Convert DB string value to JSON
		if (isRichTextField(config)) {
			let value: any = flatDoc[key];
			try {
				value = JSON.parse(value);
				flatDoc[key] = value;
			} catch (err: any) {
				console.log(err.message);
			}
		}

		if (isLinkField(config)) {
			const value: Link = flatDoc[key];
			const hasValue = !!value;
			const isResourceLinkType = (type: LinkType): type is GetRegisterType<'PrototypeSlug'> =>
				!['url', 'email', 'tel', 'anchor'].includes(type);

			if (hasValue && isResourceLinkType(value.type)) {
				try {
					const documentPrototype = rizom.config.getDocumentPrototype(value.type);
					let doc;
					if (documentPrototype === 'collection') {
						doc = await api.collection(value.type).findById({ id: value.link, locale });
					} else {
						doc = await api.global(value.type).find({ locale });
					}
					if (doc._url) flatDoc[key]._url = doc._url;
				} catch (err) {
					console.log(err);
				}
			}
		}
	}
	return flatDoc;
};

type FilterFieldsArgs = (args: {
	api: LocalAPI;
	flatDoc: Dic;
	locale?: string;
	configMap: ConfigMap;
	user: User | undefined;
}) => Promise<Dic>;
