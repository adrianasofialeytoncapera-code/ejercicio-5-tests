const request = require('supertest');
const { app, resetContacts } = require('../src/app');

describe('Contacts API — Ejercicio 6', () => {

  beforeEach(() => {
    resetContacts();
  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE A — Validación de email con regex
  // ─────────────────────────────────────────────────────────────
  describe('Bloque A — Validación de email con regex (POST)', () => {

    it('devuelve 400 cuando el email es "@" (sin usuario ni dominio)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 cuando el email es "usuario@" (sin dominio)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'usuario@' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 cuando el email es "@dominio.com" (sin usuario)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@dominio.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 cuando el email es "sin-arroba"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'sin-arroba' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('devuelve 201 cuando el email tiene formato válido "usuario@dominio.com"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'usuario@dominio.com' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Test', email: 'usuario@dominio.com' });
    });

    it('el mensaje de error contiene la palabra "email"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'invalido' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE B — Detección de email duplicado (409)
  // ─────────────────────────────────────────────────────────────
  describe('Bloque B — Detección de email duplicado', () => {

    it('crear un contacto con email ya existente devuelve 409', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Nuevo', email: 'ana@example.com' });

      expect(res.status).toBe(409);
    });

    it('el body del 409 tiene el campo error con un mensaje descriptivo', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Nuevo', email: 'ana@example.com' });

      expect(res.body).toHaveProperty('error');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('crear con email en mayúsculas "ANA@EXAMPLE.COM" también devuelve 409 (case-insensitive)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Nuevo', email: 'ANA@EXAMPLE.COM' });

      expect(res.status).toBe(409);
    });

    it('después de recibir un 409 el número total de contactos no aumentó', async () => {
      await request(app)
        .post('/api/contacts')
        .send({ name: 'Nuevo', email: 'ana@example.com' });

      const res = await request(app).get('/api/contacts');
      expect(res.body.length).toBe(3);
    });

  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE C — Búsqueda y filtros en GET /api/contacts
  // ─────────────────────────────────────────────────────────────
  describe('Bloque C — Búsqueda y filtros (?search y ?favorite)', () => {

    it('?search=ana devuelve solo contactos cuyo nombre o email contiene "ana"', async () => {
      const res = await request(app).get('/api/contacts?search=ana');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(c => {
        const match =
          c.name.toLowerCase().includes('ana') ||
          c.email.toLowerCase().includes('ana');
        expect(match).toBe(true);
      });
    });

    it('?search=ANA (mayúsculas) devuelve los mismos resultados (case-insensitive)', async () => {
      const lower = await request(app).get('/api/contacts?search=ana');
      const upper = await request(app).get('/api/contacts?search=ANA');

      expect(upper.body).toEqual(lower.body);
    });

    it('?search=example filtra por email y devuelve todos los que tienen "@example.com"', async () => {
      const res = await request(app).get('/api/contacts?search=example');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('?search=xyznoexiste devuelve un array vacío (no un 404)', async () => {
      const res = await request(app).get('/api/contacts?search=xyznoexiste');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('?favorite=true devuelve solo contactos con favorite: true', async () => {
      const res = await request(app).get('/api/contacts?favorite=true');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(c => expect(c.favorite).toBe(true));
    });

    it('?favorite=true devuelve solo a Luis (el único favorito inicial)', async () => {
      const res = await request(app).get('/api/contacts?favorite=true');

      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Luis Pérez');
    });

    it('sin query params devuelve todos los contactos', async () => {
      const res = await request(app).get('/api/contacts');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE D — Toggle de favorito (PATCH)
  // ─────────────────────────────────────────────────────────────
  describe('Bloque D — Toggle de favorito (PATCH /api/contacts/:id/favorite)', () => {

    it('llamar PATCH en Ana (favorite: false) devuelve el contacto con favorite: true', async () => {
      const res = await request(app).patch('/api/contacts/1/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(true);
    });

    it('llamarlo dos veces sobre el mismo contacto regresa a favorite: false', async () => {
      await request(app).patch('/api/contacts/1/favorite');
      const res = await request(app).patch('/api/contacts/1/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(false);
    });

    it('llamarlo en Luis (favorite: true) devuelve el contacto con favorite: false', async () => {
      const res = await request(app).patch('/api/contacts/2/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(false);
    });

    it('devuelve 404 para un ID inexistente', async () => {
      const res = await request(app).patch('/api/contacts/999/favorite');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('después del toggle, un GET sobre el mismo ID refleja el cambio persistido', async () => {
      await request(app).patch('/api/contacts/1/favorite');

      const res = await request(app).get('/api/contacts/1');
      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(true);
    });

  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE E — PUT mejorado
  // ─────────────────────────────────────────────────────────────
  describe('Bloque E — PUT mejorado (/api/contacts/:id)', () => {

    it('actualizar solo el name devuelve 200 con el nombre cambiado', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ name: 'Ana Actualizada' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Ana Actualizada');
    });

    it('intentar actualizar con un email de formato inválido devuelve 400', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'no-es-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('intentar actualizar con el email de otro contacto existente devuelve 409', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'luis@example.com' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('actualizar con el mismo email del propio contacto devuelve 200 (no es duplicado externo)', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'ana@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('ana@example.com');
    });

    it('actualizar un ID inexistente devuelve 404', async () => {
      const res = await request(app)
        .put('/api/contacts/999')
        .send({ name: 'Nadie' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

  });

  // ─────────────────────────────────────────────────────────────
  // BLOQUE F — Middleware de error y formato uniforme
  // ─────────────────────────────────────────────────────────────
  describe('Bloque F — Middleware de error y formato uniforme', () => {

    it('GET /api/ruta-que-no-existe devuelve 404 con Content-Type: application/json', async () => {
      const res = await request(app).get('/api/ruta-que-no-existe');

      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('la respuesta del 404 genérico tiene el campo error en el body (no HTML)', async () => {
      const res = await request(app).get('/api/ruta-que-no-existe');

      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });

    it('los errores 400 incluyen el campo status con el número de código HTTP', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ email: 'invalido' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
    });

    it('los errores 404 incluyen el campo status con el número de código HTTP', async () => {
      const res = await request(app).get('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
    });

    it('los errores 409 incluyen el campo status con el número de código HTTP', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Dup', email: 'ana@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe(409);
    });

  });

});