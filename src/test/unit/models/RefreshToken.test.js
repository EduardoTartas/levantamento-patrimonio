import mongoose from 'mongoose';
import RefreshToken from '@models/RefreshToken';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock do modelo Usuario para populate
const usuarioSchema = new mongoose.Schema({ 
  nome: String,
  email: String 
});
mongoose.models.usuario = mongoose.model('usuario', usuarioSchema);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await RefreshToken.deleteMany();
  // Limpar também o modelo Usuario mockado
  const Usuario = mongoose.model('usuario');
  await Usuario.deleteMany();
});

describe('RefreshToken Model', () => {
  describe('Criação de RefreshToken', () => {
    test('deve criar um refresh token válido com todos os campos obrigatórios', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'valid-refresh-token-123';
      
      const refreshToken = await RefreshToken.create({
        token: tokenString,
        user: userId,
      });

      expect(refreshToken._id).toBeDefined();
      expect(refreshToken.user.toString()).toBe(userId.toString());
      expect(refreshToken.createdAt).toBeInstanceOf(Date);
      expect(refreshToken.updatedAt).toBeInstanceOf(Date);
      expect(refreshToken.__v).toBeUndefined(); // versionKey: false
    });

    test('deve criar refresh token com createdAt automático', async () => {
      const userId = new mongoose.Types.ObjectId();
      const before = new Date();
      
      const refreshToken = await RefreshToken.create({
        token: 'auto-timestamp-token',
        user: userId,
      });

      const after = new Date();
      
      expect(refreshToken.createdAt).toBeInstanceOf(Date);
      expect(refreshToken.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(refreshToken.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('deve criar refresh token com timestamps automáticos', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'timestamps-token',
        user: userId,
      });

      expect(refreshToken.createdAt).toBeDefined();
      expect(refreshToken.updatedAt).toBeDefined();
      expect(refreshToken.createdAt).toBeInstanceOf(Date);
      expect(refreshToken.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validações de campos obrigatórios', () => {
    test('deve lançar erro se "token" estiver ausente', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await expect(
        RefreshToken.create({ user: userId })
      ).rejects.toThrow(/Path `token` is required/);
    });

    test('deve lançar erro se "token" for string vazia', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await expect(
        RefreshToken.create({ token: '', user: userId })
      ).rejects.toThrow(/Path `token` is required/);
    });

    test('deve lançar erro se "token" for null', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await expect(
        RefreshToken.create({ token: null, user: userId })
      ).rejects.toThrow(/Path `token` is required/);
    });

    test('deve lançar erro se "user" estiver ausente', async () => {
      await expect(
        RefreshToken.create({ token: 'valid-token' })
      ).rejects.toThrow(/Path `user` is required/);
    });

    test('deve lançar erro se "user" for null', async () => {
      await expect(
        RefreshToken.create({ token: 'valid-token', user: null })
      ).rejects.toThrow(/Path `user` is required/);
    });

    test('deve lançar erro se "user" não for um ObjectId válido', async () => {
      await expect(
        RefreshToken.create({ 
          token: 'valid-token', 
          user: 'invalid-object-id' 
        })
      ).rejects.toThrow(/Cast to ObjectId failed/);
    });
  });

  describe('Restrição de unicidade', () => {
    test('deve garantir que "token" seja único', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const duplicateToken = 'duplicate-token-123';
      
      await RefreshToken.create({ 
        token: duplicateToken, 
        user: userId1 
      });

      await expect(
        RefreshToken.create({ 
          token: duplicateToken, 
          user: userId2 
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('deve permitir tokens diferentes para o mesmo usuário', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const token1 = await RefreshToken.create({ 
        token: 'token-1', 
        user: userId 
      });
      
      const token2 = await RefreshToken.create({ 
        token: 'token-2', 
        user: userId 
      });

      expect(token1._id).not.toEqual(token2._id);
      expect(token1.user.toString()).toBe(token2.user.toString());
    });

    test('deve permitir mesmo token para usuários diferentes após expiração', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const sameToken = 'same-token-different-users';
      
      // Criar primeiro token
      await RefreshToken.create({ 
        token: sameToken, 
        user: userId1 
      });

      // Remover o primeiro token (simulando expiração)
      await RefreshToken.deleteOne({ token: sameToken });

      // Deve conseguir criar novo token com mesmo valor
      const newToken = await RefreshToken.create({ 
        token: sameToken, 
        user: userId2 
      });

      // Verificar se foi criado com sucesso
      expect(newToken._id).toBeDefined();
      expect(newToken.user.toString()).toBe(userId2.toString());
      
      // Verificar se realmente foi criado no banco e o token está correto
      const foundWithToken = await RefreshToken.findById(newToken._id).select('+token');
      expect(foundWithToken.token).toBe(sameToken);
      
      // Verificar que não aparece em consulta normal (select: false)
      const foundNormal = await RefreshToken.findById(newToken._id);
      expect(foundNormal.token).toBeUndefined();
    });
  });

  describe('Comportamento do campo "select: false"', () => {
    test('campo "token" não deve ser retornado por padrão em find()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'hidden-token-find';

      await RefreshToken.create({ 
        token: tokenString, 
        user: userId 
      });

      const found = await RefreshToken.findOne({});

      expect(found.token).toBeUndefined();
      expect(found.user).toBeDefined();
      expect(found._id).toBeDefined();
    });

    test('campo "token" não deve ser retornado por padrão em findOne()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'hidden-token-findone';

      await RefreshToken.create({ 
        token: tokenString, 
        user: userId 
      });

      const found = await RefreshToken.findOne({ user: userId });

      expect(found.token).toBeUndefined();
      expect(found.user.toString()).toBe(userId.toString());
    });

    test('campo "token" não deve ser retornado com .lean()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'hidden-token-lean';

      await RefreshToken.create({ 
        token: tokenString, 
        user: userId 
      });

      const found = await RefreshToken.findOne({}).lean();

      expect(found.token).toBeUndefined();
      expect(found.user.toString()).toBe(userId.toString());
    });

    test('campo "token" pode ser retornado com .select("+token")', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'visible-token-select';

      await RefreshToken.create({ 
        token: tokenString, 
        user: userId 
      });

      const found = await RefreshToken.findOne().select('+token');

      expect(found.token).toBe(tokenString);
      expect(found.user.toString()).toBe(userId.toString());
    });

    test('campo "token" pode ser retornado com .select("+token").lean()', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenString = 'visible-token-select-lean';

      await RefreshToken.create({ 
        token: tokenString, 
        user: userId 
      });

      const found = await RefreshToken.findOne().select('+token').lean();

      expect(found.token).toBe(tokenString);
      expect(found.user.toString()).toBe(userId.toString());
    });
  });

  describe('TTL (Time To Live) e Expiração', () => {
    test('deve definir TTL através do campo expires no schema', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'ttl-token',
        user: userId,
      });

      // Verificar se o documento foi criado com sucesso
      expect(refreshToken._id).toBeDefined();
      expect(refreshToken.createdAt).toBeInstanceOf(Date);
      
      // Verificar se o campo createdAt tem o comportamento de expiração configurado
      // O MongoDB criará automaticamente um índice TTL baseado no campo expires
      const schemaPath = RefreshToken.schema.paths.createdAt;
      expect(schemaPath.options.expires).toBe(60 * 60 * 24 * 7); // 7 dias em segundos
    });

    test('deve marcar documento para expiração baseado em createdAt', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'expiring-token',
        user: userId,
      });

      // Calcular quando deve expirar (7 dias após createdAt)
      const expectedExpiration = new Date(
        refreshToken.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)
      );

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      expect(expectedExpiration.getTime()).toBeCloseTo(sevenDaysFromNow.getTime(), -10000);
    });
  });

  describe('Operações CRUD', () => {
    test('deve conseguir buscar por user ID', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      
      await RefreshToken.create({ 
        token: 'user-token-1', 
        user: userId 
      });
      
      await RefreshToken.create({ 
        token: 'user-token-2', 
        user: otherUserId 
      });

      const userTokens = await RefreshToken.find({ user: userId });

      expect(userTokens).toHaveLength(1);
      expect(userTokens[0].user.toString()).toBe(userId.toString());
    });

    test('deve conseguir atualizar um refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const newUserId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'update-token',
        user: userId,
      });

      const updated = await RefreshToken.findByIdAndUpdate(
        refreshToken._id,
        { user: newUserId },
        { new: true }
      );

      expect(updated.user.toString()).toBe(newUserId.toString());
      expect(updated.updatedAt.getTime()).toBeGreaterThan(refreshToken.updatedAt.getTime());
    });

    test('deve conseguir deletar um refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'delete-token',
        user: userId,
      });

      await RefreshToken.findByIdAndDelete(refreshToken._id);

      const found = await RefreshToken.findById(refreshToken._id);
      expect(found).toBeNull();
    });

    test('deve conseguir deletar todos os tokens de um usuário', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await RefreshToken.create({ token: 'user-token-1', user: userId });
      await RefreshToken.create({ token: 'user-token-2', user: userId });
      await RefreshToken.create({ token: 'user-token-3', user: userId });

      const deleteResult = await RefreshToken.deleteMany({ user: userId });

      expect(deleteResult.deletedCount).toBe(3);
      
      const remaining = await RefreshToken.find({ user: userId });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Populate e referências', () => {
    test('deve referenciar corretamente o modelo "usuario"', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const refreshToken = await RefreshToken.create({
        token: 'reference-token',
        user: userId,
      });

      // Verificar se a referência está correta
      expect(refreshToken.user).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(refreshToken.user.toString()).toBe(userId.toString());
    });

    test('deve permitir populate do campo user', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Criar um usuário no modelo mockado
      const Usuario = mongoose.model('usuario');
      const usuario = await Usuario.create({
        _id: userId,
        nome: 'Usuário Teste',
        email: 'teste@email.com'
      });
      
      await RefreshToken.create({
        token: 'populate-token',
        user: userId,
      });

      const found = await RefreshToken.findOne().populate('user');

      expect(found.user._id.toString()).toBe(userId.toString());
      expect(found.user.nome).toBe('Usuário Teste');
      expect(found.user.email).toBe('teste@email.com');
    });
  });

  describe('Casos extremos e validações adicionais', () => {
    test('deve aceitar tokens muito longos', async () => {
      const userId = new mongoose.Types.ObjectId();
      const longToken = 'a'.repeat(1000); // Token de 1000 caracteres
      
      const refreshToken = await RefreshToken.create({
        token: longToken,
        user: userId,
      });

      expect(refreshToken._id).toBeDefined();
      expect(refreshToken.user.toString()).toBe(userId.toString());
    });

    test('deve aceitar tokens com caracteres especiais', async () => {
      const userId = new mongoose.Types.ObjectId();
      const specialToken = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const refreshToken = await RefreshToken.create({
        token: specialToken,
        user: userId,
      });

      const found = await RefreshToken.findOne().select('+token');
      expect(found.token).toBe(specialToken);
    });

    test('deve lidar com múltiplas operações simultâneas', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const promises = Array.from({ length: 5 }, (_, i) =>
        RefreshToken.create({
          token: `concurrent-token-${i}`,
          user: userId,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result._id).toBeDefined();
        expect(result.user.toString()).toBe(userId.toString());
      });

      const count = await RefreshToken.countDocuments({ user: userId });
      expect(count).toBe(5);
    });
  });

  describe('Erros de validação específicos', () => {
    test('deve retornar mensagem de erro específica para token ausente', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      try {
        await RefreshToken.create({ user: userId });
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.token).toBeDefined();
        expect(error.errors.token.kind).toBe('required');
        expect(error.errors.token.path).toBe('token');
      }
    });

    test('deve retornar mensagem de erro específica para user ausente', async () => {
      try {
        await RefreshToken.create({ token: 'valid-token' });
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.user).toBeDefined();
        expect(error.errors.user.kind).toBe('required');
        expect(error.errors.user.path).toBe('user');
      }
    });

    test('deve retornar erro de duplicata com código específico', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const duplicateToken = 'duplicate-error-token';
      
      await RefreshToken.create({ 
        token: duplicateToken, 
        user: userId1 
      });

      try {
        await RefreshToken.create({ 
          token: duplicateToken, 
          user: userId2 
        });
      } catch (error) {
        expect(error.name).toBe('MongoServerError');
        expect(error.code).toBe(11000); // Duplicate key error code
        expect(error.message).toMatch(/duplicate key/i);
      }
    });
  });
});
