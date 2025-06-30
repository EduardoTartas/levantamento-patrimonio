import LoginController from '@controllers/LoginController';
import { NovaSenhaSchema } from '@utils/validators/schemas/zod/NovaSenhaSchema.js';

jest.mock('@repositories/LoginRepository'); // se desejar mockar também
jest.mock('@services/LoginService');

describe('LoginController', () => {
    let controller;
    let mockService;

    beforeEach(() => {
        controller = new LoginController();
        mockService = controller.service;

        mockService.autenticar = jest.fn();
        mockService.refreshToken = jest.fn();
        mockService.redefinirSenha = jest.fn();
        mockService.solicitarRecuperacao = jest.fn();
        mockService.deletarRefreshToken = jest.fn();
    });

    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const mockNext = jest.fn();

    describe('login', () => {
        it('deve retornar status 200 e dados do usuário no login', async () => {
            const req = { body: { email: 'user@test.com', senha: '123456' } };
            const res = mockResponse();

            const mockUser = { id: '1', nome: 'Usuário' };
            mockService.autenticar.mockResolvedValue(mockUser);

            await controller.login(req, res, mockNext);

            expect(mockService.autenticar).toHaveBeenCalledWith('user@test.com', '123456');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: 'Login realizado com sucesso.',
                ...mockUser,
            });
        });

        it('deve chamar next com erro se autenticação falhar', async () => {
            const req = { body: { email: 'user@test.com', senha: '123456' } };
            const res = mockResponse();
            const error = new Error('Falha na autenticação');
            mockService.autenticar.mockRejectedValue(error);

            try {
                await controller.login(req, res, mockNext);
            } catch (err) {
                // Simula que asyncWrapper chamaria next(err)
                mockNext(err);
            }

            expect(mockNext).toHaveBeenCalledWith(error);
        });

    });

    describe('refreshToken', () => {
        it('deve retornar status 200 e tokens quando refreshToken fornecido', async () => {
            const req = { body: { refreshToken: 'token123' } };
            const res = mockResponse();

            const mockTokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
            mockService.refreshToken.mockResolvedValue(mockTokens);

            await controller.refreshToken(req, res, mockNext);

            expect(mockService.refreshToken).toHaveBeenCalledWith('token123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTokens);
        });

        it('deve lançar AuthenticationError se refreshToken não fornecido', async () => {
            const req = { body: {} };
            const res = mockResponse();

            await expect(controller.refreshToken(req, res, mockNext)).rejects.toThrow('Token de atualização não fornecido.');
        });

        it('deve chamar next com erro se service.refreshToken falhar', async () => {
            const req = { body: { refreshToken: 'token123' } };
            const res = mockResponse();
            const error = new Error('Erro no refresh');
            mockService.refreshToken.mockRejectedValue(error);

            try {
                await controller.refreshToken(req, res, mockNext);
            } catch (err) {
                mockNext(err);
            }

            expect(mockNext).toHaveBeenCalledWith(error);
        });

    });

    describe('recover', () => {
        it('deve chamar redefinirSenha e retornar resultado quando token e novaSenha fornecidos', async () => {
            const req = {
                body: { novaSenha: 'NovaSenha1!' },
                query: { token: 'token123' },
            };
            const res = mockResponse();

            const mockResult = { success: true };
            mockService.redefinirSenha.mockResolvedValue(mockResult);

            jest.spyOn(NovaSenhaSchema, 'parse').mockReturnValue('NovaSenha1!');

            await controller.recover(req, res, mockNext);

            expect(NovaSenhaSchema.parse).toHaveBeenCalledWith('NovaSenha1!');
            expect(mockService.redefinirSenha).toHaveBeenCalledWith('token123', 'NovaSenha1!');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('deve chamar solicitarRecuperacao e retornar resultado quando só email fornecido', async () => {
            const req = {
                body: { email: 'user@test.com' },
                query: {},
            };
            const res = mockResponse();

            const mockResult = { success: true };
            mockService.solicitarRecuperacao.mockResolvedValue(mockResult);

            await controller.recover(req, res, mockNext);

            expect(mockService.solicitarRecuperacao).toHaveBeenCalledWith('user@test.com');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('deve retornar status 400 se parâmetros inválidos', async () => {
            const req = {
                body: { novaSenha: 'senha_invalida' },
                query: { token: 'token123' },
            };
            const res = mockResponse();

            // Forçar parse lançar erro
            jest.spyOn(NovaSenhaSchema, 'parse').mockImplementation(() => {
                throw new Error('Senha inválida');
            });

            await controller.recover(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Parâmetros inválidos para recuperação de senha.",
                recebido: { email: undefined, token: 'token123', novaSenha: 'senha_invalida' },
            });
        });
    });

    describe('logout', () => {
        it('deve retornar status 400 se refreshToken não fornecido', async () => {
            const req = { body: {} };
            const res = mockResponse();

            await controller.logout(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Token de refresh não fornecido." });
        });

        it('deve retornar status 400 se token não encontrado', async () => {
            const req = { body: { refreshToken: 'token123' } };
            const res = mockResponse();

            mockService.deletarRefreshToken.mockResolvedValue({ deletedCount: 0 });

            await controller.logout(req, res, mockNext);

            expect(mockService.deletarRefreshToken).toHaveBeenCalledWith('token123');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Token não encontrado." });
        });

        it('deve retornar status 200 se logout realizado com sucesso', async () => {
            const req = { body: { refreshToken: 'token123' } };
            const res = mockResponse();

            mockService.deletarRefreshToken.mockResolvedValue({ deletedCount: 1 });

            await controller.logout(req, res, mockNext);

            expect(mockService.deletarRefreshToken).toHaveBeenCalledWith('token123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Logout realizado com sucesso." });
        });
    });
});
