const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function toWebPath(filePath) {
  return '/' + path.relative(rootDir, filePath).replace(/\\/g, '/');
}

const assets = [
  '/',
  '/index.html',
  '/bar-menu.html',
  '/food-menu.html',
  '/party-booking.html',
  '/specials-menu.html'
];

const cssDir = path.join(rootDir, 'assets', 'css');
if (fs.existsSync(cssDir)) {
  const cssFiles = walk(cssDir).filter(f => f.endsWith('.min.css'));
  assets.push(...cssFiles.map(toWebPath));
}

const jsDir = path.join(rootDir, 'assets', 'js');
if (fs.existsSync(jsDir)) {
  const jsFiles = walk(jsDir).filter(f => f.endsWith('.min.js'));
  assets.push(...jsFiles.map(toWebPath));
}

const eventsDir = path.join(rootDir, 'assets', 'events');
if (fs.existsSync(eventsDir)) {
  const eventFiles = walk(eventsDir).filter(f => f.endsWith('.json'));
  assets.push(...eventFiles.map(toWebPath));
}

const manifestPath = path.join(rootDir, 'precache-manifest.js');
const content = `self.__ASSETS_MANIFEST = ${JSON.stringify(assets, null, 2)};\n`;
fs.writeFileSync(manifestPath, content);
