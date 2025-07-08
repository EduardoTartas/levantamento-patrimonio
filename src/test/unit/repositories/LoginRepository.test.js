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

  describe('buscarPorEmail', () => {
    test('deve buscar usuário por email e incluir senha', async () => {
      const user = await createTestUser({ email: 'test@email.com' });
      const result = await loginRepository.buscarPorEmail('test@email.com');

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(user._id.toString());
      expect(result.email).toBe('test@email.com');
      expect(result.senha).toBeDefined();
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
  });

  describe('buscarPorId', () => {
    test('deve buscar usuário por ID sem incluir senha', async () => {
      const user = await createTestUser();
      const result = await loginRepository.buscarPorId(user._id);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(user._id.toString());
      expect(result.senha).toBeUndefined();
    });

    test('deve retornar null para ID inexistente', async () => {
      expect(await loginRepository.buscarPorId(new mongoose.Types.ObjectId())).toBeNull();
    });

    test('deve lançar erro para ID inválido', async () => {
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

    test('deve lançar erro para valores inválidos', async () => {
      const user = await createTestUser();
      
      await expect(loginRepository.salvarRefreshToken('id-invalido', 'token')).rejects.toThrow();
      await expect(loginRepository.salvarRefreshToken(user._id, undefined)).rejects.toThrow();
      await expect(loginRepository.salvarRefreshToken(user._id, null)).rejects.toThrow();
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
      expect(result.token).toBeUndefined();
    });

    test('deve retornar null para token inexistente', async () => {
      const result = await loginRepository.validarRefreshToken('token.inexistente');
      expect(result).toBeNull();
    });

    test('deve retornar null para valores inválidos', async () => {
      expect(await loginRepository.validarRefreshToken(undefined)).toBeNull();
      expect(await loginRepository.validarRefreshToken(null)).toBeNull();
      expect(await loginRepository.validarRefreshToken('')).toBeNull();
    });
  });
});
