const { addLead, json, readBody } = require('./_lib');

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
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const telegram = String(body.telegram || '').trim();
  const message = String(body.message || '').trim();
  if (!name || (!phone && !telegram)) {
    json(res, 400, { error: 'Укажите имя и телефон или Telegram' });
    return;
  }
  addLead({ name, phone, telegram, message });
  json(res, 201, { ok: true });
};
