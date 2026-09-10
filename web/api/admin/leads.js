const { json, listLeads, userFromReq } = require('../_lib');

module.exports = function handler(req, res) {
  const u = userFromReq(req);
  if (!u) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  if (u.role !== 'admin') {
    json(res, 403, { error: 'Только для администратора' });
    return;
  }
  json(res, 200, listLeads());
};
