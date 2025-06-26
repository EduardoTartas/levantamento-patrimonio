// src/test/routes/usuarioRoutes.test.js
import request from 'supertest';
import express from 'express';
import router from '@routes/usuarioRoutes.js';

// mockando middlewares para não bloquear os testes
jest.mock('../../../src/middlewares/AuthMiddleware.js', () => (req, res, next) => next());
jest.mock('../../../src/middlewares/AuthPermission.js', () => (req, res, next) => next());

// mockando o controller
jest.mock('../../../src/controllers/UsuarioController.js', () => {
  return jest.fn().mockImplementation(() => ({
    listar: jest.fn((req, res) => {
      if (req.params.id) {
        return res.status(200).json({ id: req.params.id, nome: 'Mockado' });
      }
      return res.status(200).json([{ id: '1', nome: 'Mock 1' }]);
    }),
    criar: jest.fn((req, res) => {
      return res.status(201).json({ ...req.body, id: 'novoID' });
    }),
    atualizar: jest.fn((req, res) => {
      return res.status(200).json({ ...req.body, id: req.params.id });
    }),
    deletar: jest.fn((req, res) => {
      return res.status(204).end();
    }),
    cadastrarSenha: jest.fn((req, res) => {
      return res.status(200).json({ message: 'Senha cadastrada com sucesso' });
    }),
  }));
});

const app = express();
app.use(express.json());
app.use(router);

describe('Rotas de usuário', () => {
  it('GET /usuarios deve retornar lista de usuários', async () => {
    const res = await request(app).get('/usuarios');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /usuarios/:id deve retornar um usuário', async () => {
    const id = '507f191e810c19729de860ea';
    const res = await request(app).get(`/usuarios/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', id);
  });

  it('POST /usuarios deve criar um usuário', async () => {
    const novoUsuario = { nome: 'Usuário Teste', email: 'teste@example.com', cpf: '12345678900', campus: '1' };
    const res = await request(app).post('/usuarios').send(novoUsuario);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nome', novoUsuario.nome);
  });

  it('PATCH /usuarios/:id deve atualizar um usuário', async () => {
    const id = '507f191e810c19729de860ea';
    const atualizacao = { nome: 'Atualizado' };
    const res = await request(app).patch(`/usuarios/${id}`).send(atualizacao);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', id);
    expect(res.body).toHaveProperty('nome', 'Atualizado');
  });

  it('DELETE /usuarios/:id deve deletar um usuário', async () => {
    const id = '507f191e810c19729de860ea';
    const res = await request(app).delete(`/usuarios/${id}`);
    expect(res.statusCode).toBe(204);
    expect(res.body).toEqual({});
  });

  it('POST /cadastrar-senha deve cadastrar a senha de um usuário', async () => {
    const dadosSenha = { email: 'teste@example.com', senha: 'Senha@123' };
    const res = await request(app).post('/cadastrar-senha').send(dadosSenha);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Senha cadastrada com sucesso');
  });
});
