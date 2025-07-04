import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { LoginRepository } from '@repositories/LoginRepository';
import Usuario from '@models/Usuario';
import RefreshToken from '@models/RefreshToken';
import bcrypt from 'bcrypt';

let mongoServer;
let loginRepository;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  loginRepository = new LoginRepository();
});

afterEach(async () => {
  await Usuario.deleteMany();
  await RefreshToken.deleteMany();
});

describe('LoginRepository', () => {
  // Helper para criar usuário de teste
  const createTestUser = async (userData = {}) => {
    const defaultUser = {
      campus: new mongoose.Types.ObjectId(),
      nome: 'João Silva',
      cpf: '12345678901',
      email: 'joao@email.com',
      senha: await bcrypt.hash('senha123', 10),
      cargo: 'admin',
      status: true
    };
    return Usuario.create({ ...defaultUser, ...userData });
  };

  describe('Constructor', () => {
    test('deve criar instância do LoginRepository', () => {
      expect(new LoginRepository()).toBeInstanceOf(LoginRepository);
    });
  });

  describe('buscarPorEmail', () => {
    test('deve buscar usuário por email e incluir senha', async () => {
      const user = await createTestUser({ email: 'test@email.com' });
      const result = await loginRepository.buscarPorEmail('test@email.com');

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(user._id.toString());
      expect(result.email).toBe('test@email.com');
      expect(result.senha).toBeDefined();
    });

    test('deve aceitar diferentes formatos de email válidos', async () => {
      const emails = ['user@domain.com', 'test.email@company.co.uk', 'admin+test@example.org'];
      
      for (const email of emails) {
        await createTestUser({ email, cpf: `${Math.random()}`.substr(2, 11) });
        const result = await loginRepository.buscarPorEmail(email);
        expect(result).toBeDefined();
        expect(result.email).toBe(email);
      }
    });

    test('deve retornar null quando email não existe', async () => {
      const result = await loginRepository.buscarPorEmail('inexistente@email.com');
      expect(result).toBeNull();
    });

    test('deve retornar null para valores inválidos', async () => {
      expect(await loginRepository.buscarPorEmail(undefined)).toBeNull();
      expect(await loginRepository.buscarPorEmail(null)).toBeNull();
      expect(await loginRepository.buscarPorEmail('')).toBeNull();
    });

    test('deve propagar erro de conexão com banco', async () => {
      await mongoose.disconnect();
      await expect(loginRepository.buscarPorEmail('test@email.com')).rejects.toThrow();
      await mongoose.connect(mongoServer.getUri());
    });
  });

  describe('buscarPorId', () => {
    test('deve buscar usuário por ID sem incluir senha', async () => {
      const user = await createTestUser();
      const result = await loginRepository.buscarPorId(user._id);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(user._id.toString());
      expect(result.senha).toBeUndefined();
    });

    test('deve aceitar ID como string e ObjectId', async () => {
      const user = await createTestUser();
      
      expect(await loginRepository.buscarPorId(user._id.toString())).toBeDefined();
      expect(await loginRepository.buscarPorId(user._id)).toBeDefined();
    });

    test('deve retornar null para ID inexistente ou inválido', async () => {
      expect(await loginRepository.buscarPorId(new mongoose.Types.ObjectId())).toBeNull();
      expect(await loginRepository.buscarPorId(undefined)).toBeNull();
      expect(await loginRepository.buscarPorId(null)).toBeNull();
      await expect(loginRepository.buscarPorId('id-invalido')).rejects.toThrow();
    });
  });

  describe('atualizarSenha', () => {
    test('deve atualizar senha do usuário', async () => {
      const user = await createTestUser();
      const novaSenha = 'novaSenha123';

      const result = await loginRepository.atualizarSenha(user._id, novaSenha);
      expect(result).toBeDefined();

      const updatedUser = await Usuario.findById(user._id).select('+senha');
      expect(updatedUser.senha).toBe(novaSenha);
    });

    test('deve aceitar diferentes tipos de senha', async () => {
      const user = await createTestUser();
      const senhas = ['simples', await bcrypt.hash('hasheada', 10), '123@#$', ''];

      for (const senha of senhas) {
        await loginRepository.atualizarSenha(user._id, senha);
        const updatedUser = await Usuario.findById(user._id).select('+senha');
        expect(updatedUser.senha).toBe(senha);
      }
    });

    test('deve retornar null para ID inexistente', async () => {
      const result = await loginRepository.atualizarSenha(new mongoose.Types.ObjectId(), 'senha');
      expect(result).toBeNull();
    });

    test('deve lançar erro para ID inválido', async () => {
      await expect(loginRepository.atualizarSenha('id-invalido', 'senha')).rejects.toThrow();
    });
  });

  describe('salvarRefreshToken', () => {
    test('deve salvar novo refresh token', async () => {
      const user = await createTestUser();
      const token = 'novo.refresh.token';

      const result = await loginRepository.salvarRefreshToken(user._id, token);
      expect(result).toBeDefined();
      expect(result.user.toString()).toBe(user._id.toString());

      const savedToken = await RefreshToken.findOne({ user: user._id }).select('+token');
      expect(savedToken.token).toBe(token);
    });

    test('deve deletar tokens existentes antes de salvar novo', async () => {
      const user = await createTestUser();
      
      await RefreshToken.create({ token: 'token1', user: user._id });
      await RefreshToken.create({ token: 'token2', user: user._id });
      
      expect(await RefreshToken.find({ user: user._id })).toHaveLength(2);

      await loginRepository.salvarRefreshToken(user._id, 'novo.token');
      expect(await RefreshToken.find({ user: user._id })).toHaveLength(1);
    });

    test('deve aceitar diferentes formatos de token', async () => {
      const user = await createTestUser();
      const tokens = ['simple.token', 'eyJhbGciOiJIUzI1NiJ9.test', 'token@#$%', '123456'];

      for (const token of tokens) {
        const result = await loginRepository.salvarRefreshToken(user._id, token);
        expect(result).toBeDefined();
        await RefreshToken.deleteMany({ user: user._id });
      }
    });

    test('deve lançar erro para valores inválidos', async () => {
      const user = await createTestUser();
      
      await expect(loginRepository.salvarRefreshToken('id-invalido', 'token')).rejects.toThrow();
      await expect(loginRepository.salvarRefreshToken(user._id, undefined)).rejects.toThrow();
      await expect(loginRepository.salvarRefreshToken(user._id, null)).rejects.toThrow();
      await expect(loginRepository.salvarRefreshToken(user._id, '')).rejects.toThrow();
    });

    test('deve lançar erro para token duplicado', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com', cpf: '11111111111' });
      const user2 = await createTestUser({ email: 'user2@test.com', cpf: '22222222222' });
      const token = 'duplicate.token';

      await loginRepository.salvarRefreshToken(user1._id, token);
      await expect(loginRepository.salvarRefreshToken(user2._id, token)).rejects.toThrow();
    });
  });

  describe('deleteRefreshToken', () => {
    test('deve deletar refresh token existente', async () => {
      const user = await createTestUser();
      const token = 'token.para.deletar';
      
      await RefreshToken.create({ token, user: user._id });

      const result = await loginRepository.deleteRefreshToken(token);
      expect(result.deletedCount).toBe(1);
      expect(await RefreshToken.findOne({ token })).toBeNull();
    });

    test('deve retornar deletedCount 0 para token inexistente', async () => {
      const result = await loginRepository.deleteRefreshToken('token.inexistente');
      expect(result.deletedCount).toBe(0);
    });

    test('deve deletar apenas o token específico', async () => {
      const user = await createTestUser();
      const token1 = 'token1.delete';
      const token2 = 'token2.keep';
      
      await RefreshToken.create({ token: token1, user: user._id });
      await RefreshToken.create({ token: token2, user: user._id });

      const result = await loginRepository.deleteRefreshToken(token1);
      expect(result.deletedCount).toBe(1);
      expect(await RefreshToken.findOne({ token: token2 })).toBeDefined();
      expect(await RefreshToken.findOne({ token: token1 })).toBeNull();
    });

    test('deve aceitar diferentes formatos de token', async () => {
      const user = await createTestUser();
      const tokens = ['simple', 'token-dash', 'token_underscore', 'token@special'];

      for (const token of tokens) {
        await RefreshToken.create({ token, user: user._id });
        const result = await loginRepository.deleteRefreshToken(token);
        expect(result.deletedCount).toBe(1);
      }
    });

    test('deve retornar deletedCount 0 para valores inválidos', async () => {
      expect((await loginRepository.deleteRefreshToken(undefined)).deletedCount).toBe(0);
      expect((await loginRepository.deleteRefreshToken(null)).deletedCount).toBe(0);
      expect((await loginRepository.deleteRefreshToken('')).deletedCount).toBe(0);
    });
  });

  describe('validarRefreshToken', () => {
    test('deve encontrar refresh token válido', async () => {
      const user = await createTestUser();
      const token = 'token.valido';
      
      await RefreshToken.create({ token, user: user._id });

      const result = await loginRepository.validarRefreshToken(token);
      expect(result).toBeDefined();
      expect(result.user.toString()).toBe(user._id.toString());
      expect(result.token).toBeUndefined(); // campo tem select: false
    });

    test('deve retornar null para token inexistente', async () => {
      const result = await loginRepository.validarRefreshToken('token.inexistente');
      expect(result).toBeNull();
    });

    test('deve aceitar diferentes formatos de token', async () => {
      const user = await createTestUser();
      const tokens = ['simple', 'token-dash', 'eyJhbGciOiJIUzI1NiJ9.test', 'token@#$'];

      for (const token of tokens) {
        await RefreshToken.create({ token, user: user._id });
        const result = await loginRepository.validarRefreshToken(token);
        expect(result).toBeDefined();
        await RefreshToken.deleteMany({ token });
      }
    });

    test('deve incluir campos necessários do token', async () => {
      const user = await createTestUser();
      const token = 'token.completo';
      
      await RefreshToken.create({ token, user: user._id });

      const result = await loginRepository.validarRefreshToken(token);
      expect(result._id).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.token).toBeUndefined(); // select: false
    });

    test('deve retornar null para valores inválidos', async () => {
      expect(await loginRepository.validarRefreshToken(undefined)).toBeNull();
      expect(await loginRepository.validarRefreshToken(null)).toBeNull();
      expect(await loginRepository.validarRefreshToken('')).toBeNull();
    });

    test('deve buscar token case sensitive', async () => {
      const user = await createTestUser();
      const token = 'TokenCaseSensitive';
      
      await RefreshToken.create({ token, user: user._id });

      expect(await loginRepository.validarRefreshToken(token)).toBeDefined();
      expect(await loginRepository.validarRefreshToken(token.toLowerCase())).toBeNull();
    });
  });

  describe('Testes de integração', () => {
    test('deve manter consistência durante operações complexas', async () => {
      const user = await createTestUser();
      const token = 'token.complexo';

      // Salvar token
      await loginRepository.salvarRefreshToken(user._id, token);

      // Validar token
      const validToken = await loginRepository.validarRefreshToken(token);
      expect(validToken).toBeDefined();

      // Deletar token
      const deleteResult = await loginRepository.deleteRefreshToken(token);
      expect(deleteResult.deletedCount).toBe(1);

      // Validar que não existe mais
      const invalidToken = await loginRepository.validarRefreshToken(token);
      expect(invalidToken).toBeNull();
    });

    test('deve lidar com operações sequenciais', async () => {
      const user = await createTestUser();
      const tokens = ['token1', 'token2', 'token3'];

      for (const token of tokens) {
        await loginRepository.salvarRefreshToken(user._id, token);
      }

      // Deve ter apenas o último token (devido ao deleteMany)
      const remainingTokens = await RefreshToken.find({ user: user._id });
      expect(remainingTokens).toHaveLength(1);
    });

    test('deve ter performance adequada', async () => {
      const user = await createTestUser();
      const operationCount = 20;
      const startTime = Date.now();

      for (let i = 0; i < operationCount; i++) {
        const token = `performance.token.${i}`;
        await loginRepository.salvarRefreshToken(user._id, token);
        await loginRepository.validarRefreshToken(token);
        await loginRepository.deleteRefreshToken(token);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 segundos para 20 operações
    });

    test('deve propagar erros de conexão', async () => {
      await mongoose.disconnect();

      await expect(loginRepository.salvarRefreshToken('id', 'token')).rejects.toThrow();
      await expect(loginRepository.deleteRefreshToken('token')).rejects.toThrow();
      await expect(loginRepository.validarRefreshToken('token')).rejects.toThrow();

      await mongoose.connect(mongoServer.getUri());
    });
  });
});
