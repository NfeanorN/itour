const { json, patchUser, publicUser, readBody, userFromReq } = require('../../_lib');

module.exports = async function handler(req, res) {
  const admin = userFromReq(req);
  if (!admin) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  if (admin.role !== 'admin') {
    json(res, 403, { error: 'Только для администратора' });
    return;
  }
  if (req.method !== 'PATCH') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  const id = Number(req.query.id);
  let body;
  try {
    body = await readBody(req);
  } catch {
    json(res, 400, { error: 'Некорректный запрос' });
    return;
  }
  const u = patchUser(id, body);
  if (!u) {
    json(res, 404, { error: 'Пользователь не найден' });
    return;
  }
  json(res, 200, publicUser(u));
};
