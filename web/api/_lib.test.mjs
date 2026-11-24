import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('./_lib.js');

const ROOT = resolve(import.meta.dirname, '..', '..');

test('seeded accounts use ARALA brand credentials and sign/parse JWTs cleanly', () => {
  const admin = lib.findUser('admin@arala.tours');
  const guest = lib.findUser('guest@arala.tours');
  assert.ok(admin, 'expected admin@arala.tours seeded user');
  assert.equal(admin.role, 'admin');
  assert.ok(guest, 'expected guest@arala.tours seeded user');
  assert.equal(guest.tourAccess, true);

  const token = lib.sign(admin);
  const claims = lib.parse(token);
  assert.equal(claims.email, 'admin@arala.tours');
  assert.equal(claims.role, 'admin');
});

test('addLead stores leads retrievable by listLeads', () => {
  lib.addLead({ name: 'Алия', phone: '+77066089508', telegram: '@aliya', message: 'Даты: 4–13 марта' });
  const leads = lib.listLeads();
  assert.ok(leads.some((l) => l.name === 'Алия' && l.message.includes('4–13 марта')));
});

test('all 5 visa guide Markdown files are synced across Vercel and Go backends with updated ARALA route', () => {
  const slugs = ['visa-overview', 'visa-documents', 'visa-italy', 'after-approval', 'packing'];
  let combined = '';
  for (const slug of slugs) {
    const webMd = readFileSync(resolve(ROOT, 'web', 'api', 'content', `${slug}.md`), 'utf8');
    const goMd = readFileSync(resolve(ROOT, 'server', 'content', 'guides', `${slug}.md`), 'utf8');
    assert.equal(webMd, goMd, `guide ${slug}.md differs between web/api/content and server/content/guides`);
    assert.ok(!/itour/i.test(webMd), `stale iTour mention in ${slug}.md`);
    combined += `\n${webMd}`;
  }
  assert.ok(combined.includes('Милан'), 'guides should reference Milan');
  assert.ok(combined.includes('Базель'), 'guides should reference Basel');
  assert.ok(combined.includes('Мюррен'), 'guides should reference Mürren');
  assert.ok(combined.includes('90 €'), 'guides should reference 90 € consular fee');
  assert.ok(combined.includes('5–7 кг'), 'guides should reference 5–7 kg hand luggage');
});
