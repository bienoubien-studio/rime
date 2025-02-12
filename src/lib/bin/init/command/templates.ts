import { randomId } from '$lib/utils/random.js';
import dedent from 'dedent';

const PACKAGE = 'rizom';

export const env = () => `BETTER_AUTH_SECRET=${randomId(32)}
PUBLIC_RIZOM_URL=http://localhost:5173

# RIZOM_CACHE_ENABLED=false

# RIZOM_SMTP_USER=user@mail.com
# RIZOM_SMTP_PASSWORD=supersecret
# RIZOM_SMTP_HOST=smtphost.com
# RIZOM_SMTP_PORT=465
`;

export const emptyConfig = (name: string) => `
import type { Config, CollectionConfig } from '${PACKAGE}';
import { text } from '${PACKAGE}/fields';

const Pages: CollectionConfig = {
	slug: 'pages',
	group: 'content',
	fields: [text('title').isTitle()]
};

const config: Config = {
  database: '${name}.sqlite',
  collections: [Pages],
  globals: []
};
export default config;
`;

export const drizzleConfig = (name: string) => `
import { defineConfig, type Config } from 'drizzle-kit';

export const config: Config = {
  schema: './src/lib/server/schema.ts',
  out: './db',
  strict: false,
  dialect: 'sqlite',
  dbCredentials: {
    url: './db/${name}.sqlite'
  }
};

export default defineConfig(config);
`;

export const emptySchema = dedent`
  const schema = {}
  export const relationFieldsMap = {};
  export const tables = {}
  export default schema;
  export type Schema = typeof schema
`;

export const hooks = `import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '${PACKAGE}';
import config from './config/rizom.config.js';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
`;

export const auth = (name: string) => `
  import { betterAuth } from "better-auth";
  import Database from "better-sqlite3";

  export const auth = betterAuth({
      database: new Database("./db/${name}.db"),
  })`;
