import { randomId } from '$lib/util/random.js';

const PACKAGE = 'rizom';

export const env = () => `BETTER_AUTH_SECRET=${randomId(32)}
PUBLIC_RIZOM_URL=http://localhost:5173

# RIZOM_CACHE_ENABLED=false
# RIZOM_SMTP_USER=user@mail.com
# RIZOM_SMTP_PASSWORD=supersecret
# RIZOM_SMTP_HOST=smtphost.com
# RIZOM_SMTP_PORT=465
`;

export const defaultConfig = (name: string) => `
import { collection, defineConfig } from '${PACKAGE}';
import { text } from '${PACKAGE}/fields';

const Pages = collection('pages', {
	group: 'content',
	fields: [text('title').isTitle()]
});

export default defineConfig({
  database: '${name}.sqlite',
  collections: [Pages],
  areas: []
});
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

export const hooks = `import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '${PACKAGE}';
import config from 'rizom:config';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
`;

export const auth = (name: string) => `
  import { betterAuth } from "better-auth";
  import Database from "better-sqlite3";

  export const auth = betterAuth({
      database: new Database("./db/${name}.db"),
  })`;
