const express = require('express');
 const knex = require('./db');
 const app = express();
 app.use(express.json());
 knex.schema.hasTable('usuarios').then(exists => {
  if (!exists) {
    return knex.schema.createTable('usuarios', table => {
      table.increments('id');
      table.string('nome');
      table.string('email');
    });
  }

  app.get('/usuarios', async (req, res) => {
    const usuarios = await knex('usuarios').select('*');
    res.json(usuarios);
   });
   app.post('/usuarios', async (req, res) => {
    const { nome, email } = req.body;
    await knex('usuarios').insert({ nome, email });
    res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
   });
   app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
   });

   