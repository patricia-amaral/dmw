const express = require('express');
const knex = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const SEGREDO = "minhasecretkey"

app.post('/signup', async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  await knex('usuarios').insert({ nome, email, senha: hash });
  res.status(201).json({ mensagem: "Usuário cadastrado!" });
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await knex('usuarios').where({ email }).first();
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }
  const token = jwt.sign({ id: usuario.id }, SEGREDO);
  res.json({ token });
 });

 function autenticar(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ erro: "Token não enviado" });
  try {
    const [, token] = auth.split(" ");
    const payload = jwt.verify(token, SEGREDO);
    req.usuario_id = payload.id;
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
  }
}
 
  app.post('/mensagens', autenticar, async (req, res) => {
    const { texto } = req.body;
    await knex('mensagens').insert({
      usuario_id: req.usuario_id,
      texto
    });
    res.status(201).json({ mensagem: "Mensagem criada" });
   });
   app.get('/mensagens', async (req, res) => {
    const mensagens = await knex('mensagens')
      .join('usuarios', 'usuarios.id', '=', 'mensagens.usuario_id')
      .select('mensagens.id', 'usuarios.nome', 'mensagens.texto', 
  'mensagens.data_postagem');
    res.json(mensagens);
   });

const express = require('express');
 const knex = require('./db');
 //const app = express();
 app.use(express.json());
 knex.schema.hasTable('usuarios').then(exists => {
  if (!exists) {
    return knex.schema.createTable('usuarios', table => {
      table.increments('id');
      table.string('nome');
      table.string('email');
    });
  }
});

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