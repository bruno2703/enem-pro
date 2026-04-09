// Generates src/assets/licenses.json with name, version, license, repo
// for each runtime dependency listed in package.json (and transitive deps).
//
// Run with: node scripts/build-licenses.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NODE_MODULES = path.join(ROOT, 'node_modules');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

const visited = new Set();
const result = [];

function readPkg(name) {
  try {
    const p = path.join(NODE_MODULES, name, 'package.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function collect(name) {
  if (visited.has(name)) return;
  visited.add(name);

  const pkg = readPkg(name);
  if (!pkg) return;

  let license = 'UNKNOWN';
  if (typeof pkg.license === 'string') license = pkg.license;
  else if (pkg.license && pkg.license.type) license = pkg.license.type;
  else if (Array.isArray(pkg.licenses) && pkg.licenses[0] && pkg.licenses[0].type)
    license = pkg.licenses[0].type;

  let repo;
  if (typeof pkg.repository === 'string') repo = pkg.repository;
  else if (pkg.repository && pkg.repository.url)
    repo = pkg.repository.url
      .replace(/^git\+/, '')
      .replace(/\.git$/, '')
      .replace(/^git:\/\//, 'https://');

  result.push({
    name: pkg.name,
    version: pkg.version,
    license,
    repository: repo,
  });
}

// Only direct dependencies (transitive would explode the list — most users
// only care about the first-party libs and Play Store accepts that).
for (const dep of Object.keys(PKG.dependencies || {})) {
  collect(dep);
}

result.sort((a, b) => a.name.localeCompare(b.name));

const outPath = path.join(ROOT, 'src/assets/licenses.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Wrote ${result.length} licenses to ${outPath}`);
