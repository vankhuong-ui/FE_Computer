import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets', 'js');

const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

test('all ES module files in assets/js pass syntax check', () => {
    assert.ok(jsFiles.length >= 12, 'Expected modular JS files in assets/js');
    for (const file of jsFiles) {
        const fullPath = path.join(JS_DIR, file);
        execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
    }
});

test('all inline <script type="module"> blocks in HTML files have valid JS syntax and existing local imports', () => {
    const importRegex = /from\s+['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g;
    const tmpFile = path.join(__dirname, '.tmp-inline-check.mjs');

    try {
        for (const htmlFile of htmlFiles) {
            const content = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
            const scriptBlocks = [...content.matchAll(/<script\s+type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi)];

            scriptBlocks.forEach((match, idx) => {
                const code = match[1];
                fs.writeFileSync(tmpFile, code, 'utf8');
                try {
                    execFileSync(process.execPath, ['--check', tmpFile], { stdio: 'pipe' });
                } catch (err) {
                    assert.fail(`Syntax error in ${htmlFile} inline module #${idx + 1}: ${err.message}`);
                }

                for (const imp of code.matchAll(importRegex)) {
                    const rawSpec = (imp[1] || imp[2]).split('?')[0].split('#')[0];
                    const resolved = path.resolve(ROOT, rawSpec);
                    assert.ok(fs.existsSync(resolved), `${htmlFile} imports missing module: ${rawSpec}`);
                }
            });
        }
    } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
});

test('all relative imports inside assets/js/*.js resolve to existing files', () => {
    const importRegex = /from\s+['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g;
    for (const jsFile of jsFiles) {
        const content = fs.readFileSync(path.join(JS_DIR, jsFile), 'utf8');
        for (const imp of content.matchAll(importRegex)) {
            const rawSpec = (imp[1] || imp[2]).split('?')[0].split('#')[0];
            const resolved = path.resolve(JS_DIR, rawSpec);
            assert.ok(fs.existsSync(resolved), `assets/js/${jsFile} imports missing module: ${rawSpec}`);
        }
    }
});

test('no HTML or JS file references removed pages, stale 10-branch copy, or removed inventory WebSocket topic', () => {
    const forbidden = [
        { pattern: /support\.html/i, reason: 'Removed support.html link' },
        { pattern: /admin-support\.html/i, reason: 'Removed admin-support.html link' },
        { pattern: /admin-address\.html/i, reason: 'Removed admin-address.html link' },
        { pattern: /10\s+chi\s+nhánh/i, reason: 'Stale 10-branch copy' },
        { pattern: /\/topic\/inventory\//i, reason: 'Removed /topic/inventory/ subscription' }
    ];

    const targets = [
        ...htmlFiles.map(f => ({ label: f, content: fs.readFileSync(path.join(ROOT, f), 'utf8') })),
        ...jsFiles.map(f => ({ label: `assets/js/${f}`, content: fs.readFileSync(path.join(JS_DIR, f), 'utf8') }))
    ];

    for (const target of targets) {
        for (const rule of forbidden) {
            assert.equal(
                rule.pattern.test(target.content),
                false,
                `${target.label} contains forbidden reference (${rule.reason})`
            );
        }
    }
});
