import request from 'supertest';
import express from 'express';
import router from '@routes/usuarioRoutes.js';

jest.mock('@middlewares/AuthMiddleware.js', () => (req, res, next) => {
    req.user = { _id: 'testuser', id: 'testuser' };
    next();
});

jest.mock('@middlewares/AuthPermission.js', () => (req, res, next) => {
    next();
});

jest.mock('@controllers/UsuarioController.js', () => {
  return jest.fn().mockImplementation(() => ({
    listar: jest.fn((req, res) => {
      if (req.params.id) {
        if (req.params.id === '000000000000000000000000') {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        if (req.params.id === 'id-invalido') {
          return res.status(400).json({ message: 'ID inválido' });
        }
        return res.status(200).json({ 
          data: { 
            _id: req.params.id, 
            nome: 'Usuário Mockado',
            email: 'usuario@mock.com',
            cpf: '12345678909',
            campus: 'campus123',
            cargo: 'Comissionado'
          } 
        });
      }
      
      if (req.query.nome) {
        if (req.query.nome === 'UsuarioInexistente') {
          return res.status(200).json({
            data: {
              docs: [],
              totalDocs: 0,
              page: 1,
              totalPages: 0
            }
          });
        }
        return res.status(200).json({
          data: {
            docs: [{ _id: '1', nome: req.query.nome, email: 'filtrado@mock.com' }],
            totalDocs: 1,
            page: 1,
            totalPages: 1
          }
        });
      }
      
      if (req.query.page && req.query.limite) {
        if (req.query.page === '0' || req.query.limite === '150') {
          return res.status(400).json({ message: 'Parâmetros de paginação inválidos' });
        }
        return res.status(200).json({
          data: {
            docs: [
              { _id: '1', nome: 'Usuario 1' },
              { _id: '2', nome: 'Usuario 2' }
            ],
            totalDocs: 20,
            page: parseInt(req.query.page),
            totalPages: 4
          }
        });
      }
      
      return res.status(200).json({
        data: {
          docs: [
            { _id: '1', nome: 'Mock 1', email: 'mock1@test.com' },
            { _id: '2', nome: 'Mock 2', email: 'mock2@test.com' }
          ],
          totalDocs: 2,
          page: 1,
          totalPages: 1
        }
      });
    }),
    criar: jest.fn((req, res) => {
      if (!req.body.nome || !req.body.email || !req.body.cpf || !req.body.campus || !req.body.cargo) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
      }
      
      if (req.body.email === 'duplicado@test.com') {
        return res.status(409).json({ message: 'Email já está em uso' });
      }
      
      if (req.body.cpf === '99999999999') {
        return res.status(409).json({ message: 'CPF já está em uso' });
      }
      
      if (req.body.campus === 'campus-inexistente') {
        return res.status(404).json({ message: 'Campus não encontrado' });
      }
      
      if (req.body.email === 'email-invalido') {
        return res.status(400).json({ message: 'Formato de email inválido' });
      }
      
      if (req.body.cpf === 'cpf-invalido') {
        return res.status(400).json({ message: 'CPF inválido' });
      }
      
      return res.status(201).json({ 
        data: { 
          ...req.body, 
          _id: 'novoID',
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      });
    }),
    atualizar: jest.fn((req, res) => {
      if (req.params.id === '000000000000000000000000') {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      if (req.params.id === 'id-invalido') {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      if (req.body.email === 'duplicado@test.com') {
        return res.status(409).json({ message: 'Email já está em uso' });
      }
      
      return res.status(200).json({ 
        data: { 
          ...req.body, 
          _id: req.params.id,
          updatedAt: new Date()
        } 
      });
    }),
    deletar: jest.fn((req, res) => {
      if (req.params.id === '000000000000000000000000') {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      if (req.params.id === 'id-invalido') {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      return res.status(200).json({ message: 'Usuário deletado com sucesso' });
    }),
    cadastrarSenha: jest.fn((req, res) => {
      if (!req.query.token) {
        return res.status(400).json({ message: 'Token obrigatório' });
      }
      
      if (req.query.token === 'token-invalido') {
        return res.status(400).json({ message: 'Token inválido ou expirado' });
      }
      
      if (!req.body.senha || req.body.senha === '123') {
        return res.status(400).json({ message: 'Senha deve conter pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial' });
      }
      
      return res.status(200).json({ message: 'Senha cadastrada com sucesso' });
    }),
  }));
});

const app = express();
app.use(express.json());
app.use(router);

describe('Rotas de usuário', () => {
  describe('GET /usuarios', () => {
    it('deve retornar lista de usuários', async () => {
      const res = await request(app).get('/usuarios');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('docs');
      expect(Array.isArray(res.body.data.docs)).toBe(true);
      expect(res.body.data.docs.length).toBe(2);
      expect(res.body.data).toHaveProperty('totalDocs', 2);
      expect(res.body.data).toHaveProperty('page', 1);
      expect(res.body.data).toHaveProperty('totalPages', 1);
    });

    it('deve aplicar filtro de busca por nome', async () => {
      const res = await request(app).get('/usuarios?nome=João');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.docs.length).toBe(1);
      expect(res.body.data.docs[0].nome).toBe('João');
    });

    it('deve retornar lista vazia para filtros sem correspondência', async () => {
      const res = await request(app).get('/usuarios?nome=UsuarioInexistente');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.docs.length).toBe(0);
      expect(res.body.data.totalDocs).toBe(0);
    });

    it('deve aplicar paginação corretamente', async () => {
      const res = await request(app).get('/usuarios?page=2&limite=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.docs.length).toBe(2);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.totalDocs).toBe(20);
      expect(res.body.data.totalPages).toBe(4);
    });

    it('deve validar parâmetros de paginação inválidos', async () => {
      const res = await request(app).get('/usuarios?page=0&limite=150');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Parâmetros de paginação inválidos');
    });
  });

  describe('GET /usuarios/:id', () => {
    it('deve retornar um usuário específico por ID', async () => {
      const id = '507f191e810c19729de860ea';
      const res = await request(app).get(`/usuarios/${id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('_id', id);
      expect(res.body.data).toHaveProperty('nome', 'Usuário Mockado');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('cpf');
      expect(res.body.data).toHaveProperty('campus');
      expect(res.body.data).toHaveProperty('cargo');
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const res = await request(app).get('/usuarios/000000000000000000000000');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Usuário não encontrado');
    });

    it('deve retornar 400 para ID inválido', async () => {
      const res = await request(app).get('/usuarios/id-invalido');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('ID inválido');
    });
  });

  describe('POST /usuarios', () => {
    it('deve criar um usuário com dados válidos', async () => {
      const novoUsuario = { 
        nome: 'Usuário Teste', 
        email: 'teste@example.com', 
        cpf: '12345678909', 
        campus: 'campus123',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(novoUsuario);
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('nome', novoUsuario.nome);
      expect(res.body.data).toHaveProperty('email', novoUsuario.email);
      expect(res.body.data).toHaveProperty('cpf', novoUsuario.cpf);
      expect(res.body.data).toHaveProperty('campus', novoUsuario.campus);
      expect(res.body.data).toHaveProperty('cargo', novoUsuario.cargo);
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('deve retornar erro 400 para campos obrigatórios ausentes', async () => {
      const usuarioIncompleto = { nome: 'Usuário Teste' };
      const res = await request(app).post('/usuarios').send(usuarioIncompleto);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Campos obrigatórios ausentes');
    });

    it('deve retornar erro 409 para email duplicado', async () => {
      const usuario = { 
        nome: 'Usuário Teste', 
        email: 'duplicado@test.com', 
        cpf: '12345678909', 
        campus: 'campus123',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(usuario);
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('Email já está em uso');
    });

    it('deve retornar erro 409 para CPF duplicado', async () => {
      const usuario = { 
        nome: 'Usuário Teste', 
        email: 'teste@example.com', 
        cpf: '99999999999', 
        campus: 'campus123',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(usuario);
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('CPF já está em uso');
    });

    it('deve retornar erro 404 para campus inexistente', async () => {
      const usuario = { 
        nome: 'Usuário Teste', 
        email: 'teste@example.com', 
        cpf: '12345678909', 
        campus: 'campus-inexistente',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(usuario);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Campus não encontrado');
    });

    it('deve retornar erro 400 para email inválido', async () => {
      const usuario = { 
        nome: 'Usuário Teste', 
        email: 'email-invalido', 
        cpf: '12345678909', 
        campus: 'campus123',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(usuario);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Formato de email inválido');
    });

    it('deve retornar erro 400 para CPF inválido', async () => {
      const usuario = { 
        nome: 'Usuário Teste', 
        email: 'teste@example.com', 
        cpf: 'cpf-invalido', 
        campus: 'campus123',
        cargo: 'Comissionado'
      };
      const res = await request(app).post('/usuarios').send(usuario);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('CPF inválido');
    });
  });

  describe('PATCH /usuarios/:id', () => {
    it('deve atualizar um usuário existente', async () => {
      const id = '507f191e810c19729de860ea';
      const atualizacao = { nome: 'Nome Atualizado', cargo: 'Funcionario Cpalm' };
      const res = await request(app).patch(`/usuarios/${id}`).send(atualizacao);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('_id', id);
      expect(res.body.data).toHaveProperty('nome', 'Nome Atualizado');
      expect(res.body.data).toHaveProperty('cargo', 'Funcionario Cpalm');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('deve retornar erro 404 para usuário inexistente', async () => {
      const atualizacao = { nome: 'Nome Atualizado' };
      const res = await request(app).patch('/usuarios/000000000000000000000000').send(atualizacao);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Usuário não encontrado');
    });

    it('deve retornar erro 400 para ID inválido', async () => {
      const atualizacao = { nome: 'Nome Atualizado' };
      const res = await request(app).patch('/usuarios/id-invalido').send(atualizacao);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('ID inválido');
    });

    it('deve retornar erro 409 para email duplicado na atualização', async () => {
      const id = '507f191e810c19729de860ea';
      const atualizacao = { email: 'duplicado@test.com' };
      const res = await request(app).patch(`/usuarios/${id}`).send(atualizacao);
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('Email já está em uso');
    });
  });

  describe('DELETE /usuarios/:id', () => {
    it('deve deletar um usuário existente', async () => {
      const id = '507f191e810c19729de860ea';
      const res = await request(app).delete(`/usuarios/${id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Usuário deletado com sucesso');
    });

    it('deve retornar erro 404 para usuário inexistente', async () => {
      const res = await request(app).delete('/usuarios/000000000000000000000000');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Usuário não encontrado');
    });

    it('deve retornar erro 400 para ID inválido', async () => {
      const res = await request(app).delete('/usuarios/id-invalido');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('ID inválido');
    });
  });

  describe('POST /cadastrar-senha', () => {
    it('deve cadastrar senha com dados válidos', async () => {
      const dadosSenha = { senha: 'SenhaForte123@' };
      const res = await request(app).post('/cadastrar-senha?token=valid-token').send(dadosSenha);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Senha cadastrada com sucesso');
    });

    it('deve retornar erro 400 para token ausente', async () => {
      const dadosSenha = { senha: 'SenhaForte123@' };
      const res = await request(app).post('/cadastrar-senha').send(dadosSenha);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Token obrigatório');
    });

    it('deve retornar erro 400 para token inválido', async () => {
      const dadosSenha = { senha: 'SenhaForte123@' };
      const res = await request(app).post('/cadastrar-senha?token=token-invalido').send(dadosSenha);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Token inválido ou expirado');
    });

    it('deve retornar erro 400 para senha fraca', async () => {
      const dadosSenha = { senha: '123' };
      const res = await request(app).post('/cadastrar-senha?token=valid-token').send(dadosSenha);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Senha deve conter pelo menos 8 caracteres');
    });

    it('deve retornar erro 400 para senha ausente', async () => {
      const res = await request(app).post('/cadastrar-senha?token=valid-token').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Senha deve conter pelo menos 8 caracteres');
    });
  });
});
