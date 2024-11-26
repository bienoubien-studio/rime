import { random } from '$lib/utils/index.js';

const PACKAGE = 'rizom';

export const env = () => `BEAM_SECRET=${random.randomId(32)}
PUBLIC_BEAM_URL=http://localhost:5173

# BEAM_SMTP_USER=user@mail.com
# BEAM_SMTP_PASSWORD=supersecret
# BEAM_SMTP_HOST=smtphost.com
# BEAM_SMTP_PORT=465
`;

export const emptyConfig = `
const config = {
  collections: [],
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

export const emptySchema = `
  const schema = {}
  export const relationFieldsMap = {};
  export const tables = {}
  export default schema;
  export type Schema = typeof schema
`;

export const hooks = `import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '${PACKAGE}';
import { rizom } from '${PACKAGE}';

const init = async () => {
	await rizom.init();
};

init();

export const handle = sequence(...handlers);
`;
