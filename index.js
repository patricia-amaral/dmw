const express = require('express');
const cors = require('cors');
const knex = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
const SEGREDO = process.env.JWT_SECRET || "minhasecretkey";

app.post('/signup', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }
  try {
    const usuarioExistente = await knex('usuarios').where({ email }).first();
    if (usuarioExistente) {
      return res.status(400).json({ erro: "Email já está em uso" });
    }
    const hash = await bcrypt.hash(senha, 10);
    await knex('usuarios').insert({ nome, email, senha: hash });
    res.status(201).json({ mensagem: "Usuário cadastrado!" });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }
  try {
    const usuario = await knex('usuarios').where({ email }).first();
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }
    const token = jwt.sign({ id: usuario.id }, SEGREDO, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

 function autenticar(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ erro: "Token não enviado" });
  try {
    const [, token] = auth.split(" ");
    const payload = jwt.verify(token, SEGREDO);
    req.usuario_id = payload.id;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ erro: "Token inválido" });
  }
}
 
  app.post('/mensagens', autenticar, async (req, res) => {
  const { texto } = req.body;
  try {
    await knex('mensagens').insert({
      usuario_id: req.usuario_id,
      texto
    });
    res.status(201).json({ mensagem: "Mensagem criada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao criar mensagem" });
  }
});
   
   app.get('/mensagens', async (req, res) => {
  try {
    const mensagens = await knex('mensagens')
      .join('usuarios', 'usuarios.id', '=', 'mensagens.usuario_id')
      .select('mensagens.id', 'usuarios.nome', 'mensagens.texto', 'mensagens.data_postagem');
    res.json(mensagens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar mensagens" });
  }
});

   app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
   });