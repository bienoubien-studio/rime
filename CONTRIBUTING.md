# Contributing

You can contribute to this project in many ways :
- adding tests
- improving documentation
- adding features
- adding translation for the panel in your language
- make it work for .js only
- try other adapters and adjust the build command to handle these.

## Clone the repo

```bash
git clone https://github.com/bienoubien-studio/rime.git
```

## Install deps
```bash
cd rime
pnpm install
```

## Init & run
```bash
pnpm svelte-kit sync
bun ./src/lib/core/dev/cli/index.ts init
pnpm dev
```

## Configuration
... doc

## Use a predifined config as a starting point
```bash
pnpm rime:use basic
```
Available names are `empty`, `basic`, `multilang`, `versions`, `versions-multilang`, respective config live inside the /tests directory.

## CLI commands

Note : for now cli commands are .ts files, so I am using `bun` to make theme work inside this repo.

Sanitize config, and generates schema, types, routes
```bash
bun ./src/lib/core/dev/cli/index.ts generate
bun ./src/lib/core/dev/cli/index.ts generate --force
```

Clear all rime related files
```bash
bun ./src/lib/core/dev/cli/index.ts clear
bun ./src/lib/core/dev/cli/index.ts clear --force
```

Build the project with adapter-node
```bash
bun ./src/lib/core/dev/cli/build.ts build
# Also copy database to the app folder
bun ./src/lib/core/dev/cli/build.ts build -d
```
