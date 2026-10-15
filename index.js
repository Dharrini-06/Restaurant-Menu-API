const express = require('express');

const app = express();
app.use(express.json({ strict: true }));

const PORT = Number(process.env.PORT) || 8080;
const categories = ['Starter', 'MainCourse', 'Dessert', 'Beverage', 'Snack'];
let dishes = [];
let nextId = 1;
const fields = ['dishName', 'restaurant', 'category', 'price', 'calories', 'isVegetarian'];

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
function validText(value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}
function validateField(field, value) {
  switch (field) {
    case 'dishName': return validText(value, 3, 60);
    case 'restaurant': return validText(value, 2, 40);
    case 'category': return typeof value === 'string' && categories.includes(value);
    case 'price': return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 5000;
    case 'calories': return Number.isInteger(value) && value >= 0 && value <= 5000;
    case 'isVegetarian': return typeof value === 'boolean';
    default: return true; // Unknown body fields are ignored.
  }
}
function cleanRecord(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Body must be a JSON object' };
  const recognized = fields.filter((field) => Object.hasOwn(body, field));
  if (partial && recognized.length === 0) return { error: 'PATCH body must contain at least one recognized field' };
  const required = fields;
  if (!partial) {
    for (const field of required) if (!Object.hasOwn(body, field)) return { error: `${field} is required` };
  }
  const result = {};
  for (const field of recognized) {
    const value = body[field];
    if (!validateField(field, value)) return { error: `Invalid ${field}` };
    result[field] = typeof value === 'string' ? value.trim() : value;
  }
  return { value: result };
}
function idIndex(id) {
  return dishes.findIndex((dish) => String(dish.id) === id);
}

app.post('/api/dishes', (req, res) => {
  const cleaned = cleanRecord(req.body, false);
  if (cleaned.error) return sendError(res, 400, cleaned.error);
  const record = { id: nextId++, ...cleaned.value };
  dishes.push(record);
  return res.status(201).json(record);
});

app.get('/api/dishes', (req, res) => {
  const q = req.query;
  const page = q.page === undefined ? 1 : Number(q.page);
  const limit = q.limit === undefined ? 10 : Number(q.limit);
  if (!Number.isInteger(page) || page < 1) return sendError(res, 400, 'Invalid page');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return sendError(res, 400, 'Invalid limit');

  let result = dishes.slice();
  if (q.category !== undefined) {
    if (!categories.includes(q.category)) return sendError(res, 400, 'Invalid category');
    result = result.filter((dish) => dish.category === q.category);
  }
  if (q.isVegetarian !== undefined) {
    if (q.isVegetarian !== 'true' && q.isVegetarian !== 'false') return sendError(res, 400, 'Invalid isVegetarian');
    result = result.filter((dish) => dish.isVegetarian === (q.isVegetarian === 'true'));
  }
  let minPrice;
  let maxPrice;
  if (q.minPrice !== undefined) {
    minPrice = Number(q.minPrice);
    if (q.minPrice.trim() === '' || !Number.isFinite(minPrice)) return sendError(res, 400, 'Invalid minPrice');
  }
  if (q.maxPrice !== undefined) {
    maxPrice = Number(q.maxPrice);
    if (q.maxPrice.trim() === '' || !Number.isFinite(maxPrice)) return sendError(res, 400, 'Invalid maxPrice');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return res.json({ data: [], page, limit, total: 0, totalPages: 0 });
  }
  if (minPrice !== undefined) result = result.filter((dish) => dish.price >= minPrice);
  if (maxPrice !== undefined) result = result.filter((dish) => dish.price <= maxPrice);
  if (q.search !== undefined && q.search !== '') {
    const term = q.search.toLowerCase();
    result = result.filter((dish) => dish.dishName.toLowerCase().includes(term) || dish.restaurant.toLowerCase().includes(term));
  }
  if (q.sort !== undefined) {
    if (!['dishName', 'price', 'calories'].includes(q.sort)) return sendError(res, 400, 'Invalid sort');
    const order = q.order === undefined ? 'asc' : q.order;
    if (!['asc', 'desc'].includes(order)) return sendError(res, 400, 'Invalid order');
    const sign = order === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const av = a[q.sort], bv = b[q.sort];
      if (typeof av === 'string') return sign * av.toLowerCase().localeCompare(bv.toLowerCase());
      return sign * (av - bv);
    });
  } else if (q.order !== undefined && !['asc', 'desc'].includes(q.order)) {
    return sendError(res, 400, 'Invalid order');
  }
  const total = result.length;
  const start = (page - 1) * limit;
  return res.json({ data: result.slice(start, start + limit), page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) });
});

app.get('/api/dishes/:id', (req, res) => {
  const index = idIndex(req.params.id);
  if (index < 0) return sendError(res, 404, 'Record not found');
  return res.json(dishes[index]);
});
app.put('/api/dishes/:id', (req, res) => {
  const index = idIndex(req.params.id);
  if (index < 0) return sendError(res, 404, 'Record not found');
  const cleaned = cleanRecord(req.body, false);
  if (cleaned.error) return sendError(res, 400, cleaned.error);
  dishes[index] = { id: dishes[index].id, ...cleaned.value };
  return res.json(dishes[index]);
});
app.patch('/api/dishes/:id', (req, res) => {
  const index = idIndex(req.params.id);
  if (index < 0) return sendError(res, 404, 'Record not found');
  const cleaned = cleanRecord(req.body, true);
  if (cleaned.error) return sendError(res, 400, cleaned.error);
  const updated = { ...dishes[index], ...cleaned.value };
  dishes[index] = updated;
  return res.json(updated);
});
app.delete('/api/dishes/:id', (req, res) => {
  const index = idIndex(req.params.id);
  if (index < 0) return sendError(res, 404, 'Record not found');
  dishes.splice(index, 1);
  return res.status(204).end();
});

app.use((req, res) => sendError(res, 404, 'Route not found'));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && Object.hasOwn(err, 'body')) return sendError(res, 400, 'Malformed JSON');
  return sendError(res, 400, 'Invalid request');
});

app.listen(PORT, () => console.log(`Restaurant Menu API listening on port ${PORT}`));

