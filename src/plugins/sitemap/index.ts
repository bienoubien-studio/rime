import { type RequestHandler } from '@sveltejs/kit';
import type { Plugin } from 'rizom/types/plugin';
import type { GetRegisterType } from 'rizom/types';
import logger from 'rizom/logger';

type SitemapPluginArgs = {
	collections?: GetRegisterType<'CollectionSlug'>[];
	globals?: GetRegisterType<'GlobalSlug'>[];
};

export const sitemap: Plugin<SitemapPluginArgs> = ({ collections = [], globals = [] }) => {
	const generateSitemap: RequestHandler = async ({ locals }) => {
		const { api } = locals;
		const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
		const xmlUrls = [];

		for (const collection of collections) {
			const prototypeAPI = api.collection(collection);
			const config = prototypeAPI.config;
			if (config.url) {
				const documents = await prototypeAPI.findAll();
				for (const document of documents) {
					const url = config.url(document);
					const lastMod = document.updatedAt?.toString();
					xmlUrls.push(`<url>\n<loc>${url}</loc>\n<lastmod>${lastMod}</lastmod>\n</url>`);
				}
			} else {
				logger.warn(`plugin sitemap: collection ${collection} config missed url key`);
			}
		}

		for (const global of globals) {
			const prototypeAPI = api.global(global);
			const config = prototypeAPI.config;
			if (config.url) {
				const document = await prototypeAPI.find();
				const url = config.url(document);
				const lastMod = document.updatedAt?.toString();
				xmlUrls.push(`<url>\n<loc>${url}</loc>\n<lastmod>${lastMod}</lastmod>\n</url>`);
			} else {
				logger.warn(`plugin sitemap: global ${global} config missed url key`);
			}
		}

		const xmlContent = `${xmlHeader}\n${xmlUrls.join('\n')}\n</urlset>`;

		return new Response(xmlContent, {
			headers: {
				'Content-Type': 'application/xml'
			}
		});
	};

	return {
		name: 'sitemap',
		routes: {
			'/sitemap.xml': {
				GET: generateSitemap
			}
		}
	};
};
