const { createHmac, timingSafeEqual } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const SECRET = process.env.JWT_SECRET || 'itour-dev-secret-change-me';

function store() {
  if (!globalThis.__itour) {
    globalThis.__itour = {
      seq: 3,
      users: [
        {
          id: 1,
          email: 'admin@itour.kz',
          name: 'Админ',
          role: 'admin',
          tourAccess: true,
          password: 'iTourAdmin2026!',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          email: 'guest@itour.kz',
          name: 'Путешественник',
          role: 'traveler',
          tourAccess: true,
          password: 'Eurotour2026!',
          createdAt: new Date().toISOString(),
        },
      ],
      leads: [],
    };
  }
  return globalThis.__itour;
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(user) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      uid: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    }),
  );
  const data = `${header}.${payload}`;
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function parse(token) {
  const [header, payload, sig] = String(token || '').split('.');
  if (!header || !payload || !sig) {
    return null;
  }
  const data = `${header}.${payload}`;
  const expected = createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return claims;
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tourAccess: u.tourAccess,
    createdAt: u.createdAt,
  };
}

function findUser(email) {
  return store().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function userById(id) {
  return store().users.find((u) => u.id === id);
}

function createUser({ email, name, password, role, tourAccess }) {
  const db = store();
  if (findUser(email)) {
    return null;
  }
  const u = {
    id: db.seq++,
    email: email.toLowerCase(),
    name,
    role: role === 'admin' ? 'admin' : 'traveler',
    tourAccess: !!tourAccess,
    password,
    createdAt: new Date().toISOString(),
  };
  db.users.unshift(u);
  return u;
}

function patchUser(id, body) {
  const u = userById(id);
  if (!u) {
    return null;
  }
  if (typeof body.name === 'string') {
    u.name = body.name;
  }
  if (typeof body.tourAccess === 'boolean') {
    u.tourAccess = body.tourAccess;
  }
  return u;
}

function listUsers() {
  return store().users.map(publicUser);
}

function addLead(lead) {
  const db = store();
  db.leads.unshift({ id: db.seq++, ...lead, createdAt: new Date().toISOString() });
}

function listLeads() {
  return store().leads;
}

function userFromReq(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) {
    return null;
  }
  const claims = parse(h.slice(7));
  if (!claims) {
    return null;
  }
  return userById(claims.uid) || null;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('bad json'));
      }
    });
    req.on('error', reject);
  });
}

const GUIDE_META = [
  { slug: 'visa-overview', title: 'Шенген: с чего начать', kicker: 'Виза' },
  { slug: 'visa-documents', title: 'Пакет документов', kicker: 'Виза' },
  { slug: 'visa-italy', title: 'Подача в Италию', kicker: 'Виза' },
  { slug: 'after-approval', title: 'После одобрения', kicker: 'Сборы' },
  { slug: 'packing', title: 'Что взять с собой', kicker: 'Сборы' },
];

function guideList() {
  return GUIDE_META;
}

function guideMarkdown(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }
  try {
    return readFileSync(join(process.cwd(), 'api', 'content', `${slug}.md`), 'utf8');
  } catch {
    return null;
  }
}

function canReadGuides(u) {
  return !!u && (u.tourAccess || u.role === 'admin');
}

module.exports = {
  addLead,
  canReadGuides,
  createUser,
  findUser,
  guideList,
  guideMarkdown,
  json,
  listLeads,
  listUsers,
  parse,
  patchUser,
  publicUser,
  readBody,
  sign,
  userById,
  userFromReq,
};
