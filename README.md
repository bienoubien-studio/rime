# Rime

Headless CMS powered by SvelteKit.

> [!NOTE]
> Not ready for production

![alt backend capture](https://github.com/bienoubien-studio/rime/blob/main/rime.png?raw=true)

## Features

- Easy configuration
- TypeScript
- Built-in authentication (better-auth)
- Auto-generated:
  - API endpoints
  - Types
  - Database schema
  - Admin panel
- SQLite database (drizzle)
- Live Edit system
- Media management
- Fine grained access control
- i18n support
- Document Hooks
- Optional SMTP integration

### Content Management

Fields types:
- Blocks
- Tree (nested array)
- Tabs
- Rich Text (TipTap)
- Relation
- Link
- Slug
- Email
- Group
- Select/Radio/Checkbox
- Number
- And more...

## Quick Start

### 1. Create a SvelteKit Project

```bash
npx sv create my-app
cd my-app
```
> [!NOTE]
> Select TypeScript when prompted

### 2. Install Rime

```bash
npm install @bienbien/rime sharp better-sqlite3
npm install -D drizzle-kit
npx rime init
```

> [!NOTE]
> pnpm missed installation of needed dependencies @lucide/svelte and drizzle-orm
> so you will need to install them manually

The `rime init` command will automatically:

- Create/populate `.env` file
- Create `src/config/rime.config.ts` config file
- Create a `db/` folder
- Add a `drizzle.config.ts`
- Create `src/hooks.server.ts` with the required initialization code
- Add the Rime plugin to `vite.config.ts`
- Push initial schema

> [!NOTE]
> Please check that these files have been properly configured:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { rime } from '@bienbien/rime/vite';

export default defineConfig({
  plugins: [rime(), sveltekit()]
});
```

```typescript
// src/hooks.server.ts (should be created)
import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from '@bienbien/rime';
import config from './lib/config.generated/rime.config.server.js';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
```

```
#.env
BETTER_AUTH_SECRET=super_secret
PUBLIC_RIME_URL=http://localhost:5173

RIME_LOG_TO_FILE=true
RIME_LOG_LEVEL=DEBUG

# RIME_CACHE_ENABLED=false
# RIME_SMTP_USER=user@mail.com
# RIME_SMTP_PASSWORD=supersecret
# RIME_SMTP_HOST=smtphost.com
# RIME_SMTP_PORT=465
```

### 3. Create the first admin user

```bash
npm run dev
```

```bash
curl -v POST http://localhost:5173/api/init \
  -H "Content-Type: application/json" \
  -d '{"email": "you@website.com", "password": "super-Secret+2000", "name": "Admin"}'
```

## Configuration Example

```typescript
// ./src/lib/config/rime.config.ts
import { buildConfig, Collection, Area } from '$rime/config';
import { Settings2 } from '@lucide/svelte';
import { relation, link, richText, text, toggle } from '@bienbien/rime/fields';
import { access } from "@bienbien/rime/util";

const Pages = Collection.create('pages', {
  group: 'content',
  fields: [
    text('title').isTitle().required(),
    relation('parent').to('pages'),
    richText('intro')
  ],
  access: {
    read: () => true,
    create: (user) => access.isAdmin(user),
    update: (user) => access.hasRoles(user, 'admin', 'editor')
  }
};

const Settings = Area.create('settings', {
  icon: Settings2,
  group: 'settings',
  fields: [
    toggle('maintenance'),
    link('about'),
    relation('logo').to('medias')
  ],
  access: {
    read: () => true
  }
};

const Medias = Collection.create('medias', {
  label: {
    singular: 'Media',
    plural: 'Medias',
  },
  upload: true,
  group: 'content',
  fields: [
    text('alt')
  ]
};

// Properties prefixed with "$" are server-only props, they will be stripped
// in the generated client config
export default buildConfig({
  $database: 'my-db.sqlite'
  collections: [Pages, Medias],
  areas: [Settings],
  staff: {
    roles: [{ value: 'admin', label: 'Administrator' }, { value: 'editor' }],
    fields: [
      text('website')
    ],
    group: 'settings'
  },
  panel: {
    $access: (user) => access.hasRoles(user, 'admin', 'editor'),
  }
});

```

> [!NOTE]
> Icons must be imported from `@lucide/svelte` (other icon packages are not tested, but should work if a size prop is available on icon component)
> Detailed configuration documentation is in development. Feel free to open issues for questions!

## Retrieve your data

### In routes handlers :

```ts
export const load = async (event: LayoutServerLoadEvent) => {
  const { rime } = event.locals;
  // Get an Area document
  const menu = await rime.area('menu').find();
  // Get all pages documents
  const pages = await rime.collection('pages').findAll({ locale: 'en' });
  // Get a page byId
  const home = await rime.collection('pages').findById({ locale: 'en', id: 'some-id' });
  // Get a user with a query
  const [user] = await rime.collection('users').find({
    query: `where[email][equals]=some@email.com` // qs query or ParsedQsQuery
  });
  // Get some config values
  const languages = rime.config.getLocalesCodes();
  const collections = rime.config.collections;
  //...
};
```

### From the API :
```ts
const { docs } = await fetch('http://localhost:5173/api/pages').then(r => r.json())
const { docs } = await fetch('http://localhost:5173/api/pages?sort=title&limit=1').then(r => r.json())
const { docs } = await fetch('http://localhost:5173/api/pages?where[author][like]=some-id&locale=en`;').then(r => r.json())
```

## DEPLOYING

For now I am using it with @svelte/adapter-node, other adapter not tested and probably not working.

With the node adapter :
```sh
npx rime build
npx rime build -d # to copy the database directory
```
It's doing bascically `vite build` under the hood and create the polka server file inside an app directory, plus giving some info on how to run it.

## ROADMAP

- [x] switch from lucia to better-auth
- [x] Document locked while being edited by another user
- [x] Panel i18n
- [x] Document status
- [x] Tree field
- [x] more tiptap integration
- [ ] Live Edit system in practice
- [ ] Documentation

### TO v1

- [x] Document version
- [x] collection nested
- [x] more better-auth integration
- [ ] auto-saved draft
- [ ] Put bin commands in a separate package ex: @rime/kit
- [ ] configurable medias/config path

## Acknowledgments

- Built with components from @huntabyte's bits-ui
- Inspired by Kirby CMS and Payload CMS architectures
