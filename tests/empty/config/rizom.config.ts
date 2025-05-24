import { defineConfig } from 'rizom';
import { apiInit } from './api-init/index.js';

export default defineConfig({
  database: 'empty.sqlite',
  collections: [],
  areas: [],
  plugins: [apiInit()]
});
