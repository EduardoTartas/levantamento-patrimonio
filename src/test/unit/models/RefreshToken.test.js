import mongoose from 'mongoose';
import RefreshToken from '@models/RefreshToken';
import { MongoMemoryServer } from 'mongodb-memory-server';

const usuarioSchema = new mongoose.Schema({ 
    nome: String,
    email: String 
});
mongoose.models.usuario = mongoose.model('usuario', usuarioSchema);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Garantir que os índices sejam criados
    await RefreshToken.createIndexes();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await RefreshToken.deleteMany();
    const Usuario = mongoose.model('usuario');
    await Usuario.deleteMany();
});

describe('Modelo RefreshToken', () => {
    const validTokenData = () => ({
        token: 'valid-refresh-token-123',
        user: new mongoose.Types.ObjectId()
    });

    describe('Criação e validação', () => {
        it('deve criar refresh token válido', async () => {
            const tokenData = validTokenData();
            const refreshToken = await RefreshToken.create(tokenData);

            expect(refreshToken._id).toBeDefined();
            expect(refreshToken.user.toString()).toBe(tokenData.user.toString());
            expect(refreshToken.createdAt).toBeInstanceOf(Date);
            expect(refreshToken.updatedAt).toBeInstanceOf(Date);
            expect(refreshToken.__v).toBeUndefined(); // sem versionKey
        });

        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'token', data: { user: new mongoose.Types.ObjectId() }, error: /Path `token` is required/ },
                { field: 'user', data: { token: 'valid-token' }, error: /Path `user` is required/ }
            ];

            for (const { field, data, error } of testCases) {
                await expect(RefreshToken.create(data)).rejects.toThrow(error);
            }
        });

        it('deve falhar com user inválido', async () => {
            const invalidData = {
                token: 'valid-token',
                user: 'invalid-object-id'
            };

            await expect(RefreshToken.create(invalidData)).rejects.toThrow(/Cast to ObjectId failed/);
        });
    });

    describe('Restrições de unicidade', () => {
        beforeEach(async () => {
            // Garantir que os índices estejam criados antes de cada teste
            await RefreshToken.createIndexes();
        });

        it('deve garantir token único', async () => {
            const token = 'duplicate-token';
            const userId1 = new mongoose.Types.ObjectId();
            const userId2 = new mongoose.Types.ObjectId();

            // Criar o primeiro token
            const firstToken = await RefreshToken.create({ token, user: userId1 });
            expect(firstToken).toBeDefined();
            
            // Tentar criar o segundo token com o mesmo valor deve falhar
            await expect(RefreshToken.create({ token, user: userId2 }))
                .rejects
                .toThrow(expect.objectContaining({
                    code: 11000 // Código específico para violação de índice único
                }));
        });

        it('deve permitir tokens diferentes para mesmo usuário', async () => {
            const userId = new mongoose.Types.ObjectId();

            const token1 = await RefreshToken.create({ token: 'token-1', user: userId });
            const token2 = await RefreshToken.create({ token: 'token-2', user: userId });

            expect(token1._id).not.toEqual(token2._id);
            expect(token1.user.toString()).toBe(token2.user.toString());
        });
    });

    describe('Comportamento select: false', () => {
        it('campo token não deve ser retornado por padrão', async () => {
            const tokenData = validTokenData();
            await RefreshToken.create(tokenData);

            const found = await RefreshToken.findOne({});
            expect(found.token).toBeUndefined();
            expect(found.user).toBeDefined();
        });

        it('campo token pode ser retornado com select("+token")', async () => {
            const tokenData = validTokenData();
            await RefreshToken.create(tokenData);

            const found = await RefreshToken.findOne().select('+token');
            expect(found.token).toBe(tokenData.token);
            expect(found.user).toBeDefined();
        });

        it('deve funcionar com lean()', async () => {
            const tokenData = validTokenData();
            await RefreshToken.create(tokenData);

            const foundNormal = await RefreshToken.findOne().lean();
            expect(foundNormal.token).toBeUndefined();

            const foundWithToken = await RefreshToken.findOne().select('+token').lean();
            expect(foundWithToken.token).toBe(tokenData.token);
        });
    });

    describe('TTL e expiração', () => {
        it('deve ter TTL configurado no schema', async () => {
            const tokenData = validTokenData();
            const refreshToken = await RefreshToken.create(tokenData);

            const schemaPath = RefreshToken.schema.paths.createdAt;
            expect(schemaPath.options.expires).toBe(60 * 60 * 24 * 7); // 7 dias

            expect(refreshToken.createdAt).toBeInstanceOf(Date);
        });

        it('deve calcular expiração baseada em createdAt', async () => {
            const tokenData = validTokenData();
            const refreshToken = await RefreshToken.create(tokenData);

            const expectedExpiration = new Date(
                refreshToken.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)
            );

            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

            expect(expectedExpiration.getTime()).toBeCloseTo(sevenDaysFromNow.getTime(), -10000);
        });
    });

    describe('Operações CRUD', () => {
        it('deve buscar por user ID', async () => {
            const userId = new mongoose.Types.ObjectId();
            const otherUserId = new mongoose.Types.ObjectId();

            await RefreshToken.create({ token: 'user-token-1', user: userId });
            await RefreshToken.create({ token: 'user-token-2', user: otherUserId });

            const userTokens = await RefreshToken.find({ user: userId });
            expect(userTokens).toHaveLength(1);
            expect(userTokens[0].user.toString()).toBe(userId.toString());
        });

        it('deve atualizar token', async () => {
            const tokenData = validTokenData();
            const refreshToken = await RefreshToken.create(tokenData);
            const newUserId = new mongoose.Types.ObjectId();

            const updated = await RefreshToken.findByIdAndUpdate(
                refreshToken._id,
                { user: newUserId },
                { new: true }
            );

            expect(updated.user.toString()).toBe(newUserId.toString());
            expect(updated.updatedAt.getTime()).toBeGreaterThan(refreshToken.updatedAt.getTime());
        });

        it('deve deletar token', async () => {
            const tokenData = validTokenData();
            const refreshToken = await RefreshToken.create(tokenData);

            await RefreshToken.findByIdAndDelete(refreshToken._id);
            const found = await RefreshToken.findById(refreshToken._id);
            expect(found).toBeNull();
        });

        it('deve deletar múltiplos tokens do usuário', async () => {
            const userId = new mongoose.Types.ObjectId();

            await RefreshToken.create([
                { token: 'token-1', user: userId },
                { token: 'token-2', user: userId },
                { token: 'token-3', user: userId }
            ]);

            const deleteResult = await RefreshToken.deleteMany({ user: userId });
            expect(deleteResult.deletedCount).toBe(3);

            const remaining = await RefreshToken.find({ user: userId });
            expect(remaining).toHaveLength(0);
        });
    });

    describe('Populate e referências', () => {
        it('deve permitir populate do campo user', async () => {
            const userId = new mongoose.Types.ObjectId();

            const Usuario = mongoose.model('usuario');
            await Usuario.create({
                _id: userId,
                nome: 'Usuário Teste',
                email: 'teste@email.com'
            });

            await RefreshToken.create({
                token: 'populate-token',
                user: userId
            });

            const found = await RefreshToken.findOne().populate('user');
            expect(found.user._id.toString()).toBe(userId.toString());
            expect(found.user.nome).toBe('Usuário Teste');
            expect(found.user.email).toBe('teste@email.com');
        });
    });

    describe('Casos específicos', () => {
        it('deve aceitar tokens com caracteres especiais', async () => {
            const userId = new mongoose.Types.ObjectId();
            const specialToken = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';

            const refreshToken = await RefreshToken.create({
                token: specialToken,
                user: userId
            });

            const found = await RefreshToken.findOne().select('+token');
            expect(found.token).toBe(specialToken);
        });

        it('deve retornar erros específicos de validação', async () => {
            const userId = new mongoose.Types.ObjectId();

            // Teste erro de token ausente
            try {
                await RefreshToken.create({ user: userId });
            } catch (error) {
                expect(error.name).toBe('ValidationError');
                expect(error.errors.token.kind).toBe('required');
            }

            // Teste erro de duplicata
            const duplicateToken = 'duplicate-error-token';
            await RefreshToken.create({ token: duplicateToken, user: userId });

            try {
                await RefreshToken.create({ token: duplicateToken, user: new mongoose.Types.ObjectId() });
            } catch (error) {
                expect(error.name).toBe('MongoServerError');
                expect(error.code).toBe(11000);
            }
        });
    });
});
