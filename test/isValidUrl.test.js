const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the isValidUrl function from assets/js/main.js
const mainJs = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
const start = mainJs.indexOf('function isValidUrl');
const end = mainJs.indexOf('function sortByDate', start);
if (start === -1 || end === -1) {
  throw new Error('Could not isolate isValidUrl function');
}
const snippet = mainJs.slice(start, end);
vm.runInThisContext(snippet);

// Tests

test('isValidUrl allows http and https URLs', () => {
  assert.strictEqual(isValidUrl('http://example.com'), true);
  assert.strictEqual(isValidUrl('https://example.com'), true);
});

test('isValidUrl rejects javascript scheme', () => {
  assert.strictEqual(isValidUrl('javascript:alert(1)'), false);
});

test('isValidUrl rejects other non-web schemes', () => {
  assert.strictEqual(isValidUrl('ftp://example.com'), false);
});
