const { json, publicUser, userFromReq } = require('../_lib');

module.exports = function handler(req, res) {
  const u = userFromReq(req);
  if (!u) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  json(res, 200, publicUser(u));
};
