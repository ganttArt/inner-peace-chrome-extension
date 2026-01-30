#!/usr/bin/env node

/**
 * Build script to create Firefox-compatible extension
 * Converts chrome.* API calls to browser.* and uses Firefox manifest
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist-firefox');
const SRC_DIR = path.join(__dirname, '..');

// Files/directories to copy
const COPY_ITEMS = [
    'src',
    'scripts',
    'README.md'
];

// Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copy Firefox manifest as manifest.json
fs.copyFileSync(
    path.join(SRC_DIR, 'manifest-firefox.json'),
    path.join(DIST_DIR, 'manifest.json')
);
console.log('✓ Copied Firefox manifest');

// Recursively copy directory
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            // For JS files, read as text and replace chrome.* -> browser.*
            if (entry.name.endsWith('.js')) {
                const content = fs.readFileSync(srcPath, 'utf8');
                const updated = content.replace(/chrome\./g, 'browser.');
                fs.writeFileSync(destPath, updated, 'utf8');
            } else {
                // For all other files (images, binaries, etc.) copy as binary
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// Copy all items
for (const item of COPY_ITEMS) {
    const srcPath = path.join(SRC_DIR, item);
    const destPath = path.join(DIST_DIR, item);

    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
        copyDir(srcPath, destPath);
        console.log(`✓ Copied ${item}/ directory`);
    } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${item}`);
    }
}

console.log('\n✅ Firefox build complete in dist-firefox/');
console.log('\nTo test in Firefox:');
console.log('1. Open Firefox and go to about:debugging');
console.log('2. Click "This Firefox"');
console.log('3. Click "Load Temporary Add-on"');
console.log('4. Select manifest.json from dist-firefox/ folder');
