# Rizom

Headless CMS powered by SvelteKit.

> [!NOTE]
> Not ready for production

![alt backend capture](https://github.com/bienoubien-studio/rizom/blob/main/rizom.png?raw=true)

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

### 2. Install Rizom

```bash
npm install rizom sharp better-sqlite3
npm install -D drizzle-kit
npx rizom init
```

> [!NOTE]
> pnpm missed installation of needed dependencies @lucide/svelte and drizzle-orm
> so you will need to install them manually

The `rizom init` command will automatically:

- Create/populate `.env` file
- Create `src/config/rizom.config.ts` config file
- Create a `db/` folder
- Add a `drizzle.config.ts`
- Create `src/hooks.server.ts` with the required initialization code
- Add the Rizom plugin to `vite.config.ts`
- Push initial schema

> [!NOTE]
> Please check that these files have been properly configured:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from 'rizom/vite';

export default defineConfig({
  plugins: [rizom(), sveltekit()]
});
```

```typescript
// src/hooks.server.ts (should be created)
import { sequence } from '@sveltejs/kit/hooks';
import { handlers } from 'rizom';
import config from './config/rizom.config.js';
import * as schema from './lib/server/schema.js';

export const handle = sequence(...handlers({ config, schema }));
```

```
#.env
BETTER_AUTH_SECRET=super_secret
PUBLIC_RIZOM_URL=http://localhost:5173

RIZOM_LOG_TO_FILE=true
RIZOM_LOG_LEVEL=DEBUG

# RIZOM_CACHE_ENABLED=false
# RIZOM_SMTP_USER=user@mail.com
# RIZOM_SMTP_PASSWORD=supersecret
# RIZOM_SMTP_HOST=smtphost.com
# RIZOM_SMTP_PORT=465
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
// ./src/config/rizom.config.ts
import { defineConfig, collection, area } from 'rizom';
import { Settings2 } from '@lucide/svelte';
import { relation, link, richText, text, toggle } from 'rizom/fields';
import { access } from "rizom/util";

const Pages = collection('pages', {
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

const Settings = area('settings', {
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

const Medias = collection('medias', {
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

export default defineConfig({
  database: 'my-db.sqlite'
  collections: [Pages, Medias],
  areas: [Settings],
  panel: {
    access: (user) => access.hasRoles(user, 'admin', 'editor'),
    users: {
      roles: [{ value: 'admin', label: 'Administrator' }, { value: 'editor' }],
      fields: [
        text('website')
      ],
      group: 'settings'
    }
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
  const { rizom } = event.locals;
  // Get an Area document
  const menu = await rizom.area('menu').find();
  // Get all pages documents
  const pages = await rizom.collection('pages').findAll({ locale: 'en' });
  // Get a page byId
  const home = await rizom.collection('pages').findById({ locale: 'en', id: 'some-id' });
  // Get a user with a query
  const [user] = await rizom.collection('users').find({
    query: `where[email][equals]=some@email.com` // qs query or ParsedQsQuery
  });
  // Get some config values
  const languages = rizom.config.getLocalesCodes();
  const collections = rizom.config.collections;
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
npx rizom build
npx rizom build -d # to copy the database directory
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
- [ ] Put bin commands in a separate package ex: @rizom/kit
- [ ] configurable medias/config path

## Acknowledgments

- Built with components from @huntabyte's bits-ui
- Inspired by Kirby CMS and Payload CMS architectures
