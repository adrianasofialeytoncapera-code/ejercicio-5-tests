const request = require('supertest');
const { app, resetContacts } = require('../src/app');

describe('Contacts API', () => {

  // Antes de cada test reiniciamos los datos
  beforeEach(() => {
    resetContacts();
  });

  // GET /api/contacts 
  describe('GET /api/contacts', () => {
    it('responde con status 200 y un array', async () => {
      // Act
      const res = await request(app).get('/api/contacts');

      // Assert
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('devuelve los contactos iniciales', async () => {
      const res = await request(app).get('/api/contacts');

      expect(res.body.length).toBe(2);
    });
  });

  // GET /api/contacts/:id 
  describe('GET /api/contacts/:id', () => {
    it('devuelve el contacto correcto', async () => {
      // Act
      const res = await request(app).get('/api/contacts/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1, name: 'Ana García' });
    });

    it('devuelve 404 para un ID inexistente', async () => {
      const res = await request(app).get('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // POST /api/contacts 
  describe('POST /api/contacts', () => {
    it('crea el contacto y devuelve 201', async () => {
      // Arrange
      const nuevoContacto = { name: 'Carlos López', email: 'carlos@gmail.com' };

      // Act
      const res = await request(app)
        .post('/api/contacts')
        .send(nuevoContacto);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Carlos López', email: 'carlos@gmail.com' });
      expect(res.body.id).toBeDefined();
    });

    it('devuelve 400 si falta el name', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ email: 'test@gmail.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('devuelve 400 si el email no tiene @', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'correosingmail.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/@/);
    });

    it('devuelve 400 si falta el email', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  //  PUT /api/contacts/:id 
  describe('PUT /api/contacts/:id', () => {
    it('actualiza correctamente los campos enviados', async () => {
      // Act
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ phone: '111222333' });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.phone).toBe('111222333');
      expect(res.body.name).toBe('Ana García'); // los otros campos no cambian
    });

    it('devuelve 404 si el contacto no existe', async () => {
      const res = await request(app)
        .put('/api/contacts/999')
        .send({ phone: '000000000' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // DELETE /api/contacts/:id 
  describe('DELETE /api/contacts/:id', () => {
    it('elimina el contacto y devuelve confirmación', async () => {
      // Act
      const res = await request(app).delete('/api/contacts/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('el contacto ya no existe después de eliminarlo', async () => {
      await request(app).delete('/api/contacts/1');

      const res = await request(app).get('/api/contacts/1');
      expect(res.status).toBe(404);
    });

    it('devuelve 404 para un ID inexistente', async () => {
      const res = await request(app).delete('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

});