# RIZOM

A modern headless CMS powered by SvelteKit, designed for developer flexibility and ease of use.
_Currently in Alpha - Not recommended for production use_

## ✨ Key Features

- Easy configuration
- TypeScript
- Built-in authentication (Lucia)
- SQLite database (Drizzle)
- Auto-generated:
  - API endpoints
  - TypeScript types
  - Database schema
  - Route handlers
- Media management
- Granular access control
- i18n support
- Optional SMTP integration

### Content Management

Rich set of field types:

- Blocks
- Rich Text (TipTap)
- Relations
- Links
- Slugs
- Email
- Select/Radio/Checkbox
- And more...

![alt backend capture](https://github.com/bienoubien-studio/rizom/blob/main/rizom.png?raw=true)

## 🚀 Quick Start

### Prerequisites

- Node.js
- Bun (required for CLI commands)

### 1. Create a SvelteKit Project

```bash
npx create-svelte@latest my-app
cd my-app
npm install
```

> ⚠️ Make sure to select TypeScript when prompted

### 2. Install Rizom

```bash
npm install rizom
npm run rizom init
```

The `init` command will automatically:

- Create `src/hooks.server.ts` with the required initialization code
- Add the Rizom plugin to `vite.config.ts`
- Create/populate `.env` file with a `RIZOM_SECRET` variable

> 💡 Verify that these files have been properly configured:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from './src/lib/vite';

export default defineConfig({
	plugins: [rizom(), sveltekit()] // <- plugin here
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
	fields: [text('title').required(), relation('parent').to('pages'), richText('intro')],
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
	fields: [text('alt')]
};

const config = {
	collections: [Pages, Medias],
	globals: [Settings],
	panel: {
		access: (user) => access.hasRoles(user, 'admin', 'editor'),
		users: {
			roles: [{ value: 'admin', label: 'Administrator' }, { value: 'editor' }],
			fields: [text('website')],
			group: 'settings',
			access: {
				read: (user) => !!user,
				create: (user) => access.isAdmin(user),
				delete: (user) => access.isAdmin(user),
				update: (user, { id }) => access.isAdminOrMyself(user, id)
			}
		}
	}
};
export default config;
```

> ⚠️ **Important Notes:**
>
> - Icons must be imported from `lucide-svelte` (other icon packages are not tested)
> - Detailed configuration documentation is in development. Feel free to open issues for questions!

## Locals

You now have access to some usefull tools in your routes handlers :

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

## 🛠️ CLI Commands

### `rizom init` - Setup

```bash
rizom init [options]
  -f, --force         # Force default setup
  -s, --skip-install  # Skip dependency installation
  -n, --name <name>   # Custom project name
```

### `rizom generate` - Code Generation

```bash
rizom generate [options]
  -f, --force  # Overwrite existing files
```

### `rizom reset` - Clean up Installation

```bash
rizom reset [options]
  -f, --force  # Skip confirmation
```

**Deleted Items:**

- `.rizom` directory
- `src/routes/(rizom)` directory
- `db` directory
- `static/medias` directory
- `src/app.generated.d.ts`
- `src/lib/rizom.config.browser.js`
- `src/lib/server/schema.ts`
- `drizzle.config.ts`

## ⚠️ Known Limitations

- Requires Bun for CLI operations (temporary requirement)
- Alpha status: APIs might change

## 🙏 Acknowledgments

- Built with components from @huntabyte's bits-ui
- Inspired by Kirby CMS and Payload CMS architectures
