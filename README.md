# Rizom

Headless CMS powered by SvelteKit.
> [!NOTE]
> Currently in Alpha - Not recommended for production use

![alt backend capture](https://github.com/bienoubien-studio/rizom/blob/main/rizom.png?raw=true)

## Key Features

- Easy configuration
- TypeScript
- Built-in authentication (Lucia)
- SQLite database (Drizzle)
- Auto-generated:
  - API endpoints
  - TypeScript types
  - Database schema
  - Admin panel
- Media management
- Document and fields access control
- i18n support
- Fields custom validation
- CRUD hooks on documents
- Configuration Hot reload in dev mode
- Optional SMTP integration

### Content Management

Fields types:
- Blocks
- Rich Text (TipTap)
- Relations
- Links
- Slugs
- Email
- Select/Radio/Checkbox
- And more...

## 🚀 Quick Start

### 1. Create a SvelteKit Project

```bash
npx sv create my-app
cd my-app
```
> [!NOTE]
> Make sure to select TypeScript when prompted

### 2. Install Rizom

```bash
npm install rizom
npx rizom init
```

The `init` command will automatically:

- Create `src/hooks.server.ts` with the required initialization code
- Add the Rizom plugin to `vite.config.ts`
- Create/populate `.env` file

> [!NOTE]
> Please check that these files have been properly configured:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from './src/lib/vite';

export default defineConfig({
  plugins: [rizom(), sveltekit()]
});
```

```typescript
// src/hooks.server.ts (should be created)
import { sequence } from '@sveltejs/kit/hooks';
import { handlers, rizom } from 'rizom';

const init = async () => {
  await rizom.init();
};

init();

export const handle = sequence(...handlers);
```
```
#.env
RIZOM_SECRET=super_secret
PUBLIC_RIZOM_URL=http://localhost:5173
```

### 3. Visit Admin Panel

Once initialized, navigate to `http://localhost:5173/panel` to create your first admin user.

## Configuration Example

```typescript
// ./src/config/rizom.config.ts
import type { CollectionConfig, GlobalConfig } from 'rizom';
import { Settings2 } from 'lucide-svelte';
import { relation, richText, text, toggle } from 'rizom/fields';
import { access } from 'rizom/access';

const Pages: CollectionConfig = {
  slug: 'pages',
  name: 'Pages',
  asTitle: 'title',
  group: 'content',
  fields: [
	  text('title').required(),
		relation('parent').to('pages'),
		richText('intro')
	],
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	}
};

const Settings: GlobalConfig = {
	name: 'Settings',
	slug: 'settings',
	icon: Settings2,
	group: 'settings',
	fields: [
    toggle('stickyHeader').label('Sticky header'),
    link('about').label('About'),
    relation('logo').to('medias')
  ],
  access: {
    read: (user) => true
  }
};

const Medias = {
  slug: 'medias',
  name: 'Medias',
  upload: true,
  group: 'content',
  fields: [
    text('alt')
  ]
};

const config = {
  collections: [Pages, Medias],
  globals: [Settings],
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
};
export default config;
```

> [!NOTE]
> Icons must be imported from `lucide-svelte` (other icon packages are not tested)
> Detailed configuration documentation is in development. Feel free to open issues for questions!

## Retrieve your data

### In routes handlers :

```ts
export const load = async (event: LayoutServerLoadEvent) => {
  const { api, rizom } = event.locals;
  // Get a global document
  const menu = await api.global('menu').find<MenuDoc>();
  // Get all pages documents
  const pages = await api.collection('pages').findAll<PagesDoc>({ locale: 'en' });
  // Get a page byId
  const home = await api.collection('pages').findById<PagesDoc>({ locale: 'en', id: 'some-id' });
  // Get a user with a query
  const [user] = await api.collection('users').find<UsersDoc>({
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
const { docs } = await fetch('http://localhost:5173/api/pages?where[author][in_array]=some-id&locale=en`;').then(r => r.json())
```

## ROADMAP

- [ ] Document version
- [ ] Document locked while being edited by another user
- [ ] Working Live Edit system (in developpment)
- [ ] Panel i18n
- [ ] cmd-K menu in admin Panel

Feel free to open a discussion for features request.

## 🙏 Acknowledgments

- Built with components from @huntabyte's bits-ui
- Inspired by Kirby CMS and Payload CMS architectures
