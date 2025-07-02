import request from 'supertest';
import express from 'express';

// Criar app isolado para testes de rota
describe('Login Routes Tests', () => {
    let app;
    let mockController;
    let server;

    beforeAll(() => {
        // Mock do controller que será usado
        mockController = {
            login: jest.fn(),
            refreshToken: jest.fn(),
            recover: jest.fn(),
            logout: jest.fn()
        };

        // Mock do módulo LoginController
        jest.doMock('../../controllers/LoginController.js', () => {
            return jest.fn().mockImplementation(() => mockController);
        });

        // Mock do asyncWrapper
        jest.doMock('../../utils/helpers/index.js', () => ({
            asyncWrapper: (fn) => async (req, res, next) => {
                try {
                    await fn(req, res, next);
                } catch (error) {
                    next(error);
                }
            }
        }));

        // Configurar Express app
        app = express();
        app.use(express.json({ limit: '50mb' }));
        
        // Importar e usar as rotas após os mocks
        const loginRoutes = require('../../routes/loginRoutes.js').default;
        app.use('/auth', loginRoutes);
        
        // Middleware para capturar erros
        app.use((error, req, res, next) => {
            res.status(500).json({ error: error.message });
        });
    });

    afterAll(async () => {
        // Fechar servidor se existir
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
        
        // Limpar todos os mocks
        jest.resetAllMocks();
        jest.restoreAllMocks();
        jest.clearAllTimers();
        
        // Aguardar um pouco para garantir limpeza
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Configurar comportamentos padrão dos mocks
        mockController.login.mockImplementation((req, res) => {
            res.status(200).json({ 
                mensagem: 'Login realizado com sucesso.',
                token: 'fake-jwt-token',
                refreshToken: 'fake-refresh-token'
            });
        });

        mockController.refreshToken.mockImplementation((req, res) => {
            res.status(200).json({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token'
            });
        });

        mockController.recover.mockImplementation((req, res) => {
            res.status(200).json({
                mensagem: 'Email de recuperação enviado com sucesso.'
            });
        });

        mockController.logout.mockImplementation((req, res) => {
            res.status(200).json({
                message: 'Logout realizado com sucesso.'
            });
        });
    });

    describe('POST /auth/login', () => {
        it('deve processar login com dados válidos', async () => {
            const loginData = { email: 'usuario@teste.com', senha: 'MinhaSenh@123' };
            const response = await request(app).post('/auth/login').send(loginData).expect(200);
            expect(mockController.login).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({
                mensagem: 'Login realizado com sucesso.',
                token: 'fake-jwt-token',
                refreshToken: 'fake-refresh-token'
            });
        });

        it('deve aceitar diferentes formatos de email válidos', async () => {
            const validEmails = ['test@gmail.com', 'user.name@domain.co.uk', 'admin@empresa.com.br'];
            for (const email of validEmails) {
                await request(app).post('/auth/login').send({ email, senha: 'Password123!' }).expect(200);
            }
            expect(mockController.login).toHaveBeenCalledTimes(validEmails.length);
        });

        it('deve tratar erro de credenciais inválidas', async () => {
            mockController.login.mockImplementation((req, res, next) => {
                next(new Error('Credenciais inválidas'));
            });
            await request(app).post('/auth/login').send({ email: 'user@test.com', senha: 'wrongpass' }).expect(500);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });

        it('deve processar requisição com body vazio', async () => {
            await request(app).post('/auth/login').send({}).expect(200);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /auth/refresh', () => {
        it('deve processar refresh token válido', async () => {
            const refreshData = { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token' };
            const response = await request(app).post('/auth/refresh').send(refreshData).expect(200);
            expect(mockController.refreshToken).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token'
            });
        });

        it('deve tratar token expirado', async () => {
            mockController.refreshToken.mockImplementation((req, res, next) => {
                next(new Error('Token expirado'));
            });
            await request(app).post('/auth/refresh').send({ refreshToken: 'expired-token' }).expect(500);
            expect(mockController.refreshToken).toHaveBeenCalledTimes(1);
        });

        it('deve tratar token inválido', async () => {
            mockController.refreshToken.mockImplementation((req, res, next) => {
                next(new Error('Token inválido'));
            });
            await request(app).post('/auth/refresh').send({ refreshToken: 'invalid-token-format' }).expect(500);
            expect(mockController.refreshToken).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /auth/recover', () => {
        it('deve processar solicitação de recuperação com email', async () => {
            const recoverData = { email: 'usuario@recuperacao.com' };
            const response = await request(app).post('/auth/recover').send(recoverData).expect(200);
            expect(mockController.recover).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({ mensagem: 'Email de recuperação enviado com sucesso.' });
        });

        it('deve processar recuperação com token e nova senha', async () => {
            const recoverData = { email: 'usuario@test.com', novaSenha: 'NovaSenha123!' };
            await request(app).post('/auth/recover?token=reset-token').send(recoverData).expect(200);
            expect(mockController.recover).toHaveBeenCalledTimes(1);
        });

        it('deve tratar email não encontrado', async () => {
            mockController.recover.mockImplementation((req, res, next) => {
                next(new Error('Email não encontrado'));
            });
            await request(app).post('/auth/recover').send({ email: 'naoexiste@test.com' }).expect(500);
            expect(mockController.recover).toHaveBeenCalledTimes(1);
        });

        it('deve aceitar diferentes formatos de email', async () => {
            const emails = ['test@gmail.com', 'user.with.dots@domain.com', 'admin@subdomain.empresa.com.br'];
            for (const email of emails) {
                await request(app).post('/auth/recover').send({ email }).expect(200);
            }
            expect(mockController.recover).toHaveBeenCalledTimes(emails.length);
        });
    });

    describe('POST /auth/logout', () => {
        it('deve processar logout com refresh token', async () => {
            const logoutData = { refreshToken: 'valid-refresh-token' };
            const response = await request(app).post('/auth/logout').send(logoutData).expect(200);
            expect(mockController.logout).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({ message: 'Logout realizado com sucesso.' });
        });

        it('deve processar logout com header Authorization', async () => {
            await request(app).post('/auth/logout').set('Authorization', 'Bearer jwt-token')
                .send({ refreshToken: 'refresh-token' }).expect(200);
            expect(mockController.logout).toHaveBeenCalledTimes(1);
        });

        it('deve tratar token não encontrado', async () => {
            mockController.logout.mockImplementation((req, res, next) => {
                next(new Error('Token não encontrado'));
            });
            await request(app).post('/auth/logout').send({ refreshToken: 'nonexistent-token' }).expect(500);
            expect(mockController.logout).toHaveBeenCalledTimes(1);
        });

        it('deve processar logout sem body', async () => {
            await request(app).post('/auth/logout').send({}).expect(200);
            expect(mockController.logout).toHaveBeenCalledTimes(1);
        });
    });

    describe('Validação e tratamento', () => {
        it('deve aceitar apenas POST para todas as rotas', async () => {
            const routes = ['/auth/login', '/auth/refresh', '/auth/recover', '/auth/logout'];
            for (const route of routes) {
                await request(app).post(route).send({}).expect(200);
                await request(app).get(route).expect(404);
                await request(app).put(route).expect(404);
                await request(app).delete(route).expect(404);
            }
        });

        it('deve propagar erros dos controllers corretamente', async () => {
            const testCases = [
                { route: '/auth/login', method: 'login', error: 'Erro de autenticação' },
                { route: '/auth/refresh', method: 'refreshToken', error: 'Erro de validação' },
                { route: '/auth/recover', method: 'recover', error: 'Erro interno do servidor' },
                { route: '/auth/logout', method: 'logout', error: 'Erro de base de dados' }
            ];

            for (const { route, method, error } of testCases) {
                mockController[method].mockImplementation((req, res, next) => {
                    next(new Error(error));
                });
                const response = await request(app).post(route).send({}).expect(500);
                expect(response.body.error).toBe(error);
                expect(mockController[method]).toHaveBeenCalledTimes(1);
                jest.clearAllMocks();
                mockController[method].mockImplementation((req, res) => {
                    res.status(200).json({ success: true });
                });
            }
        });
    });

    describe('Casos extremos e estrutura', () => {
        it('deve lidar com payload JSON grande', async () => {
            const largePayload = { email: 'test@test.com', senha: 'password', extraData: 'x'.repeat(1000) };
            await request(app).post('/auth/login').send(largePayload).expect(200);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });

        it('deve processar múltiplas requisições simultâneas', async () => {
            const promises = Array.from({ length: 3 }, (_, index) =>
                request(app).post('/auth/login').send({ email: `user${index}@test.com`, senha: 'password' }).expect(200)
            );
            await Promise.all(promises);
            expect(mockController.login).toHaveBeenCalledTimes(3);
        });

        it('deve manter Content-Type correto', async () => {
            await request(app).post('/auth/login').set('Content-Type', 'application/json')
                .send(JSON.stringify({ email: 'test@test.com', senha: 'password' })).expect(200);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });

        it('deve funcionar com caracteres especiais nos dados', async () => {
            const specialData = { email: 'usuário@açaí.com.br', senha: 'Senh@Esp€cí@l123!' };
            await request(app).post('/auth/login').send(specialData).expect(200);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });

        it('deve ter todas as rotas registradas', async () => {
            const routesToTest = [
                { path: '/auth/login', method: 'post' },
                { path: '/auth/refresh', method: 'post' },
                { path: '/auth/recover', method: 'post' },
                { path: '/auth/logout', method: 'post' }
            ];
            for (const { path, method } of routesToTest) {
                const response = await request(app)[method](path).send({});
                expect(response.status).not.toBe(404);
            }
        });

        it('deve responder com status corretos', async () => {
            await request(app).post('/auth/login').send({}).expect(200);
            await request(app).post('/auth/refresh').send({}).expect(200);
            await request(app).post('/auth/recover').send({}).expect(200);
            await request(app).post('/auth/logout').send({}).expect(200);
        });
    });

    describe('Integração com middleware asyncWrapper', () => {
        it('deve capturar erros assíncronos corretamente', async () => {
            mockController.login.mockImplementation(async (req, res, next) => {
                throw new Error('Erro assíncrono');
            });
            await request(app).post('/auth/login').send({ email: 'test@test.com', senha: 'password' }).expect(500);
            expect(mockController.login).toHaveBeenCalledTimes(1);
        });

        it('deve tratar promises rejeitadas', async () => {
            mockController.refreshToken.mockImplementation(async (req, res, next) => {
                return Promise.reject(new Error('Promise rejeitada'));
            });
            await request(app).post('/auth/refresh').send({ refreshToken: 'token' }).expect(500);
            expect(mockController.refreshToken).toHaveBeenCalledTimes(1);
        });
    });
});
