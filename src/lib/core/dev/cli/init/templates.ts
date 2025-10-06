import { randomId } from '$lib/util/random.js';

const PACKAGE = 'rime';

export const env = () => `BETTER_AUTH_SECRET=${randomId(32)}
PUBLIC_RIME_URL=http://localhost:5173

# RIME_CACHE_ENABLED=false
# RIME_SMTP_USER=user@mail.com
# RIME_SMTP_PASSWORD=supersecret
# RIME_SMTP_HOST=smtphost.com
# RIME_SMTP_PORT=465

RIME_CACHE_ENABLED=false
RIME_LOG_LEVEL=TRACE
RIME_LOG_TO_FILE=true
RIME_LOG_TO_FILE_MAX_DAYS=1
`;

export const defaultConfig = (name: string) => `
import { Collection, buildConfig } from '$${PACKAGE}/config';
import { text } from '${PACKAGE}/fields';

const Pages = Collection.create('pages', {
	group: 'content',
	fields: [text('title').isTitle()]
});

export default buildConfig({
  $database: '${name}.sqlite',
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
import config from './lib/config.generated/rime.config.server.js';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
`;

export const auth = (name: string) => `
  import { betterAuth } from "better-auth";
  import Database from "better-sqlite3";

  export const auth = betterAuth({
      database: new Database("./db/${name}.db"),
  })`;
