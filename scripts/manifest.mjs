#!/usr/bin/env node
/**
 * Stamps dist/module.json from package.json.
 *
 * The manifest Foundry fetches from master announces a version, and its
 * `download` field names the archive that carries it. Both are derived here
 * from the version in package.json, so the manifest can never advertise a
 * version while pointing at a different build: Foundry downloads the archive,
 * reads its module.json, and keeps offering the same update when the two
 * disagree.
 *
 *   node scripts/manifest.mjs           rewrite dist/module.json
 *   node scripts/manifest.mjs --check   report drift and exit 1
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'dist/module.json');
const check = process.argv.includes('--check');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const text = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(text);

if (!manifest.id || !manifest.url) {
  console.error('dist/module.json needs an "id" and a repository "url" to build the download link.');
  process.exit(1);
}

const version = pkg.version;
const download = `${manifest.url.replace(/\/+$/, '')}/releases/download/v${version}/${manifest.id}.zip`;

const drift = [
  manifest.version === version ? null : `version: dist/module.json has ${manifest.version}, package.json has ${version}`,
  manifest.download === download ? null : `download: dist/module.json has\n  ${manifest.download}\nexpected\n  ${download}`
].filter(Boolean);

if (check) {
  if (drift.length === 0) {
    console.log(`dist/module.json is in sync with package.json ${version}.`);
    process.exit(0);
  }
  console.error('dist/module.json is out of sync with package.json:');
  for (const line of drift) console.error(`  ${line}`);
  console.error('\nRun `npm run manifest` and commit dist/module.json.');
  process.exit(1);
}

if (drift.length === 0) {
  console.log(`dist/module.json already describes ${version}.`);
  process.exit(0);
}

// Keep the file's own formatting: line endings, indentation and final newline.
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const trailingNewline = /\r?\n$/.test(text);
const next = { ...manifest, version, download };
const output = JSON.stringify(next, null, 2).replace(/\n/g, eol) + (trailingNewline ? eol : '');

writeFileSync(manifestPath, output);
console.log(`dist/module.json now describes ${version}:\n  ${download}`);
