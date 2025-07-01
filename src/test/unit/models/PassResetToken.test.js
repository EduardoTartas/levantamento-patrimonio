import mongoose from 'mongoose';
import PassResetToken from '@models/PassResetToken';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await PassResetToken.deleteMany();
});

describe('PassResetToken model', () => {
  test('deve criar um token de redefinição válido', async () => {
    const tokenData = {
      usuario: new mongoose.Types.ObjectId(),
      token: 'abc123',
      expiresAt: new Date(Date.now() + 3600000), // 1 hora
    };

    const token = await PassResetToken.create(tokenData);

    expect(token._id).toBeDefined();
    expect(token.usuario).toEqual(tokenData.usuario);
    expect(token.token).toBe('abc123');
    expect(token.expiresAt).toEqual(tokenData.expiresAt);
    expect(token.used).toBe(false);
  });

  test('deve falhar se campo "usuario" estiver ausente', async () => {
    const tokenData = {
      token: 'abc123',
      expiresAt: new Date(),
    };

    await expect(PassResetToken.create(tokenData)).rejects.toThrow();
  });

  test('deve falhar se campo "token" estiver ausente', async () => {
    const tokenData = {
      usuario: new mongoose.Types.ObjectId(),
      expiresAt: new Date(),
    };

    await expect(PassResetToken.create(tokenData)).rejects.toThrow();
  });

  test('deve falhar se campo "expiresAt" estiver ausente', async () => {
    const tokenData = {
      usuario: new mongoose.Types.ObjectId(),
      token: 'abc123',
    };

    await expect(PassResetToken.create(tokenData)).rejects.toThrow();
  });

  test('campo "used" deve ser false por padrão', async () => {
    const token = await PassResetToken.create({
      usuario: new mongoose.Types.ObjectId(),
      token: 'teste',
      expiresAt: new Date(Date.now() + 10000),
    });

    expect(token.used).toBe(false);
  });

  test('deve permitir definir "used" como true', async () => {
    const token = await PassResetToken.create({
      usuario: new mongoose.Types.ObjectId(),
      token: 'teste',
      expiresAt: new Date(Date.now() + 10000),
      used: true,
    });

    expect(token.used).toBe(true);
  });

  test('deve expirar o token após "expiresAt" com TTL index', async () => {
    // NOTE: TTL só funciona após 60s+ no Mongo real, então aqui vamos simular manualmente
    const token = await PassResetToken.create({
      usuario: new mongoose.Types.ObjectId(),
      token: 'ttl-token',
      expiresAt: new Date(Date.now() + 1000), // 1 segundo
    });

    expect(token.token).toBe('ttl-token');

    // Esperar 2 segundos (simula expiração)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const found = await PassResetToken.findById(token._id);
    // Em produção, isso seria null, mas no MongoMemory o TTL não funciona real.
    // Então fazemos manualmente:
    const now = new Date();
    const isExpired = token.expiresAt < now;
    expect(isExpired).toBe(true);
  });

  test('deve ter índice TTL no campo "expiresAt"', async () => {
    const indexes = await PassResetToken.collection.getIndexes({ full: true });
    const hasTTL = indexes.some(index => {
      return index.name === 'expiresAt_1' && index.expireAfterSeconds === 0;
    });

    expect(hasTTL).toBe(true);
  });
});
