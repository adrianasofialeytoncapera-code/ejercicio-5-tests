const express = require('express');
const app = express();
app.use(express.json());

let contacts = [
  { id: 1, name: 'Ana García',  email: 'ana@gmail.com',  phone: '123456789' },
  { id: 2, name: 'Luis Pérez',  email: 'luis@gmail.com', phone: '987654321' },
];
let nextId = 3;

// Función para resetear datos entre tests
function resetContacts() {
  contacts = [
    { id: 1, name: 'Ana García',  email: 'ana@gmail.com',  phone: '123456789' },
    { id: 2, name: 'Luis Pérez',  email: 'luis@gmail.com', phone: '987654321' },
  ];
  nextId = 3;
}

// GET todos los contactos
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

// GET contacto por ID
app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });
  res.json(contact);
});

// POST crear contacto
app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El campo name es requerido.' });
  }
  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'El campo email es requerido.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'El email debe contener @.' });
  }

  const newContact = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    phone: phone || null,
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// PUT actualizar contacto
app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });

  Object.assign(contact, req.body);
  res.json(contact);
});

// DELETE eliminar contacto
app.delete('/api/contacts/:id', (req, res) => {
  const index = contacts.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Contacto no encontrado.' });

  contacts.splice(index, 1);
  res.status(200).json({ message: 'Contacto eliminado.' });
});

module.exports = { app, resetContacts };