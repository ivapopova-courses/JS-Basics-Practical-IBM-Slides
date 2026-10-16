#!/usr/bin/env node
// Translation commands (run from the course root): see i18n/README.md.
//   npm run i18n:update | i18n:status | i18n:check | i18n:pack [-- --all] | i18n:import -- <files or folder>
import { main } from './i18n.mjs'

await main(process.argv.slice(2))
