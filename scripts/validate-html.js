const fs = require('fs');
const path = require('path');

// Root directory is one level up from this script
const rootDir = path.join(__dirname, '..');

// Gather all HTML files in the root directory
const htmlFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.html'));

let allValid = true;
htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trimStart().toLowerCase().startsWith('<!doctype html>')) {
    console.error(`${file} is missing <!DOCTYPE html> declaration.`);
    allValid = false;
  }
});

if (!allValid) {
  console.error('HTML validation failed.');
  process.exit(1);
} else {
  console.log('All HTML files contain a <!DOCTYPE html> declaration.');
}
