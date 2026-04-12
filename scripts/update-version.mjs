// update-version.mjs
// Run before each build to ensure version.json matches package.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.join(__dirname, '..', 'package.json');
const versionPath = path.join(__dirname, '..', 'public', 'version.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const now = new Date().toISOString();

const versionData = {
  version: pkg.version,
  buildDate: now
};

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 1) + '\n');
console.log(`Updated version.json to v${pkg.version} (${now})`);
