---
trigger: always_on
---

- I am devoloping a package named rizom, it's an headless CMS based on SvelteKit
- It is working this way : devs define a config file, the config is built, at dev time the built config is used to generate routes, types, and drizzle schema.
- There are 2 types of documents in this CMS : collections and areas.
- Collections are list of documents that can be uploads or auth.
- Areas are singleton wich can't be uploads or auth.