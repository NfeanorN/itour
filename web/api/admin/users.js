const { createUser, json, listUsers, publicUser, readBody, userFromReq } = require('../_lib');

module.exports = async function handler(req, res) {
  const u = userFromReq(req);
  if (!u) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  if (u.role !== 'admin') {
    json(res, 403, { error: 'Только для администратора' });
    return;
  }
  if (req.method === 'GET') {
    json(res, 200, listUsers());
    return;
  }
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  let body;
  try {
    body = await readBody(req);
  } catch {
    json(res, 400, { error: 'Некорректный запрос' });
    return;
  }
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  if (!email || !name || password.length < 8) {
    json(res, 400, { error: 'Email, имя и пароль от 8 символов обязательны' });
    return;
  }
  const created = createUser({
    email,
    name,
    password,
    role: body.role,
    tourAccess: !!body.tourAccess,
  });
  if (!created) {
    json(res, 409, { error: 'Пользователь с таким email уже есть' });
    return;
  }
  json(res, 201, publicUser(created));
};
