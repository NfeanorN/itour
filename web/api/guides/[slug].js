const { canReadGuides, guideMarkdown, json, userFromReq } = require('../_lib');

module.exports = function handler(req, res) {
  const u = userFromReq(req);
  if (!u) {
    json(res, 401, { error: 'Нужно войти в аккаунт' });
    return;
  }
  if (!canReadGuides(u)) {
    json(res, 403, { error: 'Гайд открывается после покупки тура.' });
    return;
  }
  const slug = req.query.slug;
  const markdown = guideMarkdown(slug);
  if (!markdown) {
    json(res, 404, { error: 'Гайд не найден' });
    return;
  }
  json(res, 200, { slug, markdown });
};
