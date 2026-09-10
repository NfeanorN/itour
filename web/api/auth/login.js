const { findUser, json, publicUser, readBody, sign } = require('../_lib');

module.exports = async function handler(req, res) {
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
  const u = findUser(body.email);
  if (!u || u.password !== String(body.password || '')) {
    json(res, 401, { error: 'Неверный email или пароль' });
    return;
  }
  json(res, 200, { token: sign(u), user: publicUser(u) });
};
