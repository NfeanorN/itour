import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const health = require('./health.js');

const ROOT = resolve(import.meta.dirname, '..', '..');

test('health endpoint returns 200 JSON ok payload', () => {
  const headers = {};
  let body = '';
  const res = {
    statusCode: 0,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    end(chunk) {
      body = chunk;
    },
  };
  health({}, res);
  assert.equal(res.statusCode, 200);
  assert.match(headers['content-type'], /application\/json/);
  assert.deepEqual(JSON.parse(body), { status: 'ok' });
});

test('admin, auth, and login endpoints and hardcoded credentials are removed', () => {
  assert.equal(existsSync(resolve(ROOT, 'web', 'api', 'admin')), false);
  assert.equal(existsSync(resolve(ROOT, 'web', 'api', 'auth')), false);
  assert.equal(existsSync(resolve(ROOT, 'web', 'src', 'app', 'pages', 'admin.ts')), false);
  assert.equal(existsSync(resolve(ROOT, 'web', 'src', 'app', 'pages', 'login.ts')), false);

  const filesToAudit = [
    resolve(ROOT, 'README.md'),
    resolve(ROOT, 'server', 'internal', 'store', 'store.go'),
    resolve(ROOT, 'server', 'internal', 'auth', 'auth.go'),
    resolve(ROOT, 'server', 'internal', 'httpserver', 'server.go'),
  ];
  for (const file of filesToAudit) {
    const content = readFileSync(file, 'utf8');
    assert.ok(!/AralaAdmin2026|Eurotour2026|arala-dev-secret-change-me/.test(content), `hardcoded credential found in ${file}`);
  }
});

test('all 5 visa guide Markdown backups remain updated for ARALA Classic Eurotour', () => {
  const slugs = ['visa-overview', 'visa-documents', 'visa-italy', 'after-approval', 'packing'];
  let combined = '';
  for (const slug of slugs) {
    const md = readFileSync(resolve(ROOT, 'server', 'content', 'guides', `${slug}.md`), 'utf8');
    assert.ok(!/itour/i.test(md), `stale iTour mention in ${slug}.md`);
    combined += `\n${md}`;
  }
  assert.ok(combined.includes('Милан'));
  assert.ok(combined.includes('Базель'));
  assert.ok(combined.includes('Мюррен'));
  assert.ok(combined.includes('90 €'));
  assert.ok(combined.includes('5–7 кг'));
});
