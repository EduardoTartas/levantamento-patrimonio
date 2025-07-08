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

describe('Modelo PassResetToken', () => {
    const validTokenData = () => ({
        usuario: new mongoose.Types.ObjectId(),
        token: 'abc123token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hora
    });

    describe('Criação e validação', () => {
        it('deve criar token válido', async () => {
            const tokenData = validTokenData();
            const token = await PassResetToken.create(tokenData);

            expect(token._id).toBeDefined();
            expect(token.usuario).toEqual(tokenData.usuario);
            expect(token.token).toBe(tokenData.token);
            expect(token.expiresAt).toEqual(tokenData.expiresAt);
            expect(token.used).toBe(false); // valor padrão
            expect(token.createdAt).toBeDefined();
            expect(token.updatedAt).toBeDefined();
        });

        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'usuario', error: /Path `usuario` is required/ },
                { field: 'token', error: /Path `token` is required/ },
                { field: 'expiresAt', error: /Path `expiresAt` is required/ }
            ];

            for (const { field, error } of testCases) {
                const invalidData = { ...validTokenData() };
                delete invalidData[field];
                await expect(PassResetToken.create(invalidData)).rejects.toThrow(error);
            }
        });

        it('deve aceitar used personalizado', async () => {
            const tokenData = {
                ...validTokenData(),
                used: true
            };

            const token = await PassResetToken.create(tokenData);
            expect(token.used).toBe(true);
        });
    });

    describe('Funcionalidades avançadas', () => {
        it('deve verificar expiração do token', async () => {
            const expiredTokenData = {
                ...validTokenData(),
                expiresAt: new Date(Date.now() - 1000) // 1 segundo atrás
            };

            const token = await PassResetToken.create(expiredTokenData);
            const now = new Date();
            const isExpired = token.expiresAt < now;
            expect(isExpired).toBe(true);
        });

        it('deve ter índice TTL no campo expiresAt', async () => {
            const indexes = await PassResetToken.collection.getIndexes({ full: true });
            const hasTTL = indexes.some(index => {
                return index.name === 'expiresAt_1' && index.expireAfterSeconds === 0;
            });

            expect(hasTTL).toBe(true);
        });

        it('deve permitir buscar tokens não utilizados', async () => {
            const usuario = new mongoose.Types.ObjectId();
            
            await PassResetToken.create([
                { usuario, token: 'token1', expiresAt: new Date(Date.now() + 3600000), used: false },
                { usuario, token: 'token2', expiresAt: new Date(Date.now() + 3600000), used: true }
            ]);

            const tokensNaoUsados = await PassResetToken.find({ usuario, used: false });
            const tokensUsados = await PassResetToken.find({ usuario, used: true });

            expect(tokensNaoUsados.length).toBe(1);
            expect(tokensUsados.length).toBe(1);
        });

        it('deve permitir marcar token como usado', async () => {
            const token = await PassResetToken.create(validTokenData());
            
            const updatedToken = await PassResetToken.findByIdAndUpdate(
                token._id,
                { used: true },
                { new: true }
            );

            expect(updatedToken.used).toBe(true);
        });
    });
});
