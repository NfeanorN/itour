const { canReadGuides, guideList, json, userFromReq } = require('../_lib');

module.exports = function handler(req, res) {
  const u = userFromReq(req);
  if (!u) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  if (!canReadGuides(u)) {
    json(res, 403, { error: 'Гайд открывается после покупки тура. Напишите нам — выдадим доступ.' });
    return;
  }
  json(res, 200, guideList());
};
