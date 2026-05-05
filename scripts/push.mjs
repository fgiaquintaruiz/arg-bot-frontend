import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '..', 'package.json');
const versionPath = path.join(__dirname, '..', 'public', 'version.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.version;
const [major, minor, patch] = current.split('.').map(Number);
const next = `${major}.${minor}.${patch + 1}`;

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const vData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
vData.version = next;
fs.writeFileSync(versionPath, JSON.stringify(vData, null, 2) + '\n');

console.log(`Version bumped: ${current} → ${next}`);

execSync(`git add "${pkgPath}" "${versionPath}"`, { stdio: 'inherit' });
execSync(`git commit -m "chore(version): bump to ${next}" --no-verify`, { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });
