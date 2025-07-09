import LoginController from '@controllers/LoginController';
import { LoginService } from '@services/LoginService';
import { LoginRepository } from '@repositories/LoginRepository';
import AuthenticationError from '@utils/errors/AuthenticationError';
import { NovaSenhaSchema } from '@utils/validators/schemas/zod/NovaSenhaSchema';

jest.mock('@services/LoginService');
jest.mock('@repositories/LoginRepository');
jest.mock('@utils/validators/schemas/zod/NovaSenhaSchema', () => ({
  NovaSenhaSchema: {
    parse: jest.fn()
  }
}));

describe('LoginController', () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {

    jest.clearAllMocks();
    
    controller = new LoginController();
    
    mockService = {
      autenticar: jest.fn(),
      refreshToken: jest.fn(),
      redefinirSenha: jest.fn(),
      solicitarRecuperacao: jest.fn(),
      deletarRefreshToken: jest.fn()
    };

    controller.service = mockService;
    
    req = { body: {}, query: {} };
    res = createMockResponse();
    next = jest.fn();
  });

  describe('Constructor', () => {
    test('deve criar instância do LoginController com service configurado', () => {
      const newController = new LoginController();
      expect(newController.service).toBeDefined();
      expect(newController.service).toBeInstanceOf(LoginService);
    });
  });

  describe('login', () => {
    describe('Casos de sucesso', () => {
      test('deve realizar login com sucesso e retornar dados do usuário', async () => {
        const mockUsuario = {
          id: 'user123',
          nome: 'João Silva',
          email: 'joao@email.com',
          cargo: 'admin',
          accessToken: 'jwt.access.token',
          refreshToken: 'jwt.refresh.token'
        };

        req.body = { email: 'joao@email.com', senha: 'senha123' };
        mockService.autenticar.mockResolvedValue(mockUsuario);

        await controller.login(req, res, next);

        expect(mockService.autenticar).toHaveBeenCalledWith('joao@email.com', 'senha123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          mensagem: 'Login realizado com sucesso.',
          ...mockUsuario
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('deve aceitar email com diferentes formatos válidos', async () => {
        const testCases = [
          'user@domain.com',
          'test.email@company.co.uk',
          'admin+test@example.org',
          'user123@sub.domain.com'
        ];

        for (const email of testCases) {
          jest.clearAllMocks();
          req.body = { email, senha: 'password' };
          const mockUsuario = { id: '1', nome: 'Test User', email };
          mockService.autenticar.mockResolvedValue(mockUsuario);

          await controller.login(req, res, next);

          expect(mockService.autenticar).toHaveBeenCalledWith(email, 'password');
          expect(res.status).toHaveBeenCalledWith(200);
        }
      });
    });

    describe('Casos de erro', () => {
      test('deve propagar erro quando service.autenticar lança AuthenticationError', async () => {
        req.body = { email: 'user@email.com', senha: 'senhaErrada' };
        const authError = new AuthenticationError('Credenciais inválidas');
        mockService.autenticar.mockRejectedValue(authError);

        await expect(controller.login(req, res, next)).rejects.toThrow(AuthenticationError);
        expect(mockService.autenticar).toHaveBeenCalledWith('user@email.com', 'senhaErrada');
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      test('deve propagar erro genérico do service', async () => {
        req.body = { email: 'user@email.com', senha: 'senha123' };
        const genericError = new Error('Erro interno do servidor');
        mockService.autenticar.mockRejectedValue(genericError);

        await expect(controller.login(req, res, next)).rejects.toThrow('Erro interno do servidor');
        expect(mockService.autenticar).toHaveBeenCalledWith('user@email.com', 'senha123');
      });

      test('deve lidar com dados de entrada undefined', async () => {
        req.body = {}; // email e senha undefined
        const authError = new AuthenticationError('Email é obrigatório');
        mockService.autenticar.mockRejectedValue(authError);

        await expect(controller.login(req, res, next)).rejects.toThrow(AuthenticationError);
        expect(mockService.autenticar).toHaveBeenCalledWith(undefined, undefined);
      });
    });
  });

  describe('refreshToken', () => {
    describe('Casos de sucesso', () => {
      test('deve renovar tokens quando refreshToken válido é fornecido', async () => {
        const mockTokens = {
          accessToken: 'new.access.token',
          refreshToken: 'new.refresh.token',
          expiresIn: 3600
        };

        req.body = { refreshToken: 'valid.refresh.token' };
        mockService.refreshToken.mockResolvedValue(mockTokens);

        await controller.refreshToken(req, res, next);

        expect(mockService.refreshToken).toHaveBeenCalledWith('valid.refresh.token');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockTokens);
        expect(next).not.toHaveBeenCalled();
      });

      test('deve processar diferentes formatos de refreshToken', async () => {
        const testTokens = [
          'simple.token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature',
          'token-with-dashes',
          'token_with_underscores'
        ];

        for (const token of testTokens) {
          jest.clearAllMocks();
          req.body = { refreshToken: token };
          const mockTokens = { accessToken: 'new.token', refreshToken: 'new.refresh' };
          mockService.refreshToken.mockResolvedValue(mockTokens);

          await controller.refreshToken(req, res, next);

          expect(mockService.refreshToken).toHaveBeenCalledWith(token);
          expect(res.status).toHaveBeenCalledWith(200);
        }
      });
    });

    describe('Casos de erro', () => {
      test('deve lançar AuthenticationError quando refreshToken não é fornecido', async () => {
        req.body = {}; // sem refreshToken

        await expect(controller.refreshToken(req, res, next)).rejects.toThrow(AuthenticationError);
        await expect(controller.refreshToken(req, res, next)).rejects.toThrow('Token de atualização não fornecido.');
        
        expect(mockService.refreshToken).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      test('deve lançar AuthenticationError quando refreshToken é null', async () => {
        req.body = { refreshToken: null };

        await expect(controller.refreshToken(req, res, next)).rejects.toThrow(AuthenticationError);
        expect(mockService.refreshToken).not.toHaveBeenCalled();
      });

      test('deve lançar AuthenticationError quando refreshToken é string vazia', async () => {
        req.body = { refreshToken: '' };

        await expect(controller.refreshToken(req, res, next)).rejects.toThrow(AuthenticationError);
        expect(mockService.refreshToken).not.toHaveBeenCalled();
      });

      test('deve propagar erro quando service.refreshToken falha', async () => {
        req.body = { refreshToken: 'invalid.token' };
        const serviceError = new AuthenticationError('Refresh token inválido');
        mockService.refreshToken.mockRejectedValue(serviceError);

        await expect(controller.refreshToken(req, res, next)).rejects.toThrow(AuthenticationError);
        expect(mockService.refreshToken).toHaveBeenCalledWith('invalid.token');
      });

      test('deve propagar erro genérico do service', async () => {
        req.body = { refreshToken: 'valid.token' };
        const genericError = new Error('Erro de conexão com banco');
        mockService.refreshToken.mockRejectedValue(genericError);

        await expect(controller.refreshToken(req, res, next)).rejects.toThrow('Erro de conexão com banco');
        expect(mockService.refreshToken).toHaveBeenCalledWith('valid.token');
      });
    });
  });

  describe('recover', () => {
    describe('Redefinição de senha (token + novaSenha)', () => {
      describe('Casos de sucesso', () => {
        test('deve redefinir senha com sucesso quando token e novaSenha válidos', async () => {
          const mockResult = { 
            success: true, 
            message: 'Senha redefinida com sucesso' 
          };

          req.body = { novaSenha: 'NovaSenha123@' };
          req.query = { token: 'valid.reset.token' };
          
          NovaSenhaSchema.parse.mockReturnValue('NovaSenha123@');
          mockService.redefinirSenha.mockResolvedValue(mockResult);

          await controller.recover(req, res, next);

          expect(NovaSenhaSchema.parse).toHaveBeenCalledWith('NovaSenha123@');
          expect(mockService.redefinirSenha).toHaveBeenCalledWith('valid.reset.token', 'NovaSenha123@');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        test('deve aceitar diferentes formatos de senha válidos', async () => {
          const senhasValidas = [
            'MinhaSenh@123',
            'Passw0rd!',
            'Segur@123',
            'C0mplexPass#'
          ];

          for (const senha of senhasValidas) {
            jest.clearAllMocks();
            req.body = { novaSenha: senha };
            req.query = { token: 'token123' };
            
            NovaSenhaSchema.parse.mockReturnValue(senha);
            mockService.redefinirSenha.mockResolvedValue({ success: true });

            await controller.recover(req, res, next);

            expect(NovaSenhaSchema.parse).toHaveBeenCalledWith(senha);
            expect(mockService.redefinirSenha).toHaveBeenCalledWith('token123', senha);
            expect(res.status).toHaveBeenCalledWith(200);
          }
        });
      });

      describe('Casos de erro', () => {
        test('deve retornar erro 400 quando senha não atende aos critérios', async () => {
          req.body = { novaSenha: 'senha_fraca' };
          req.query = { token: 'valid.token' };
          
          NovaSenhaSchema.parse.mockImplementation(() => {
            throw new Error('Senha deve conter pelo menos uma letra maiúscula');
          });

          await controller.recover(req, res, next);

          expect(NovaSenhaSchema.parse).toHaveBeenCalledWith('senha_fraca');
          expect(mockService.redefinirSenha).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            erro: "Parâmetros inválidos para recuperação de senha.",
            recebido: { email: undefined, token: 'valid.token', novaSenha: 'senha_fraca' }
          });
        });

        test('deve retornar erro 400 quando novaSenha é vazia', async () => {
          req.body = { novaSenha: '' };
          req.query = { token: 'valid.token' };
          
          NovaSenhaSchema.parse.mockImplementation(() => {
            throw new Error('Senha é obrigatória');
          });

          await controller.recover(req, res, next);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            erro: "Parâmetros inválidos para recuperação de senha.",
            recebido: { email: undefined, token: 'valid.token', novaSenha: '' }
          });
        });

        test('deve retornar erro 400 quando service.redefinirSenha falha', async () => {
          req.body = { novaSenha: 'ValidPassword123@' };
          req.query = { token: 'expired.token' };
          
          NovaSenhaSchema.parse.mockReturnValue('ValidPassword123@');
          const serviceError = new Error('Token expirado');
          mockService.redefinirSenha.mockRejectedValue(serviceError);

          await controller.recover(req, res, next);
          
          expect(mockService.redefinirSenha).toHaveBeenCalledWith('expired.token', 'ValidPassword123@');
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            erro: "Parâmetros inválidos para recuperação de senha.",
            recebido: { email: undefined, token: 'expired.token', novaSenha: 'ValidPassword123@' }
          });
        });
      });
    });

    describe('Solicitação de recuperação (email)', () => {
      describe('Casos de sucesso', () => {
        test('deve solicitar recuperação quando apenas email é fornecido', async () => {
          const mockResult = { 
            success: true, 
            message: 'Email de recuperação enviado' 
          };

          req.body = { email: 'user@email.com' };
          req.query = {};
          
          mockService.solicitarRecuperacao.mockResolvedValue(mockResult);

          await controller.recover(req, res, next);

          expect(mockService.solicitarRecuperacao).toHaveBeenCalledWith('user@email.com');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(mockResult);
          expect(NovaSenhaSchema.parse).not.toHaveBeenCalled();
          expect(mockService.redefinirSenha).not.toHaveBeenCalled();
        });

        test('deve aceitar diferentes formatos de email válidos', async () => {
          const emailsValidos = [
            'user@domain.com',
            'test.user@company.co.uk',
            'admin+recover@example.org',
            'user123@subdomain.domain.com'
          ];

          for (const email of emailsValidos) {
            jest.clearAllMocks();
            req.body = { email };
            req.query = {};
            
            mockService.solicitarRecuperacao.mockResolvedValue({ success: true });

            await controller.recover(req, res, next);

            expect(mockService.solicitarRecuperacao).toHaveBeenCalledWith(email);
            expect(res.status).toHaveBeenCalledWith(200);
          }
        });
      });

      describe('Casos de erro', () => {
        test('deve propagar erro quando service.solicitarRecuperacao falha', async () => {
          req.body = { email: 'inexistente@email.com' };
          req.query = {};
          
          const serviceError = new Error('Usuário não encontrado');
          mockService.solicitarRecuperacao.mockRejectedValue(serviceError);

          await expect(controller.recover(req, res, next)).rejects.toThrow('Usuário não encontrado');
          expect(mockService.solicitarRecuperacao).toHaveBeenCalledWith('inexistente@email.com');
        });
      });
    });

    describe('Casos de parâmetros inválidos', () => {
      test('deve retornar erro 400 quando nenhum parâmetro é fornecido', async () => {
        req.body = {};
        req.query = {};

        await controller.recover(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          erro: "Parâmetros inválidos para recuperação de senha.",
          recebido: { email: undefined, token: undefined, novaSenha: undefined }
        });
        expect(mockService.solicitarRecuperacao).not.toHaveBeenCalled();
        expect(mockService.redefinirSenha).not.toHaveBeenCalled();
      });

      test('deve retornar erro 400 quando token é fornecido sem novaSenha', async () => {
        req.body = {};
        req.query = { token: 'some.token' };

        await controller.recover(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          erro: "Parâmetros inválidos para recuperação de senha.",
          recebido: { email: undefined, token: 'some.token', novaSenha: undefined }
        });
      });

      test('deve retornar erro 400 quando novaSenha é fornecida sem token', async () => {
        req.body = { novaSenha: 'ValidPassword123@' };
        req.query = {};

        await controller.recover(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          erro: "Parâmetros inválidos para recuperação de senha.",
          recebido: { email: undefined, token: undefined, novaSenha: 'ValidPassword123@' }
        });
      });

      test('deve processar redefinição quando email, token e novaSenha são fornecidos', async () => {
        req.body = { email: 'user@email.com', novaSenha: 'ValidPassword123@' };
        req.query = { token: 'some.token' };
        
        const mockResult = { success: true, message: 'Senha redefinida' };
        NovaSenhaSchema.parse.mockReturnValue('ValidPassword123@');
        mockService.redefinirSenha.mockResolvedValue(mockResult);

        await controller.recover(req, res, next);

        // O controller prioriza token + novaSenha quando ambos estão presentes
        expect(NovaSenhaSchema.parse).toHaveBeenCalledWith('ValidPassword123@');
        expect(mockService.redefinirSenha).toHaveBeenCalledWith('some.token', 'ValidPassword123@');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('logout', () => {
    describe('Casos de sucesso', () => {
      test('deve realizar logout com sucesso quando refreshToken válido', async () => {
        req.body = { refreshToken: 'valid.refresh.token' };
        mockService.deletarRefreshToken.mockResolvedValue({ deletedCount: 1 });

        await controller.logout(req, res, next);

        expect(mockService.deletarRefreshToken).toHaveBeenCalledWith('valid.refresh.token');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ 
          message: "Logout realizado com sucesso." 
        });
      });

      test('deve aceitar diferentes formatos de refreshToken', async () => {
        const tokens = [
          'simple.token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature',
          'token-with-dashes',
          'token_with_underscores'
        ];

        for (const token of tokens) {
          jest.clearAllMocks();
          req.body = { refreshToken: token };
          mockService.deletarRefreshToken.mockResolvedValue({ deletedCount: 1 });

          await controller.logout(req, res, next);

          expect(mockService.deletarRefreshToken).toHaveBeenCalledWith(token);
          expect(res.status).toHaveBeenCalledWith(200);
        }
      });
    });

    describe('Casos de erro', () => {
      test('deve retornar erro 400 quando refreshToken não é fornecido', async () => {
        req.body = {}; // sem refreshToken

        await controller.logout(req, res, next);

        expect(mockService.deletarRefreshToken).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
          message: "Token de refresh não fornecido." 
        });
      });

      test('deve retornar erro 400 quando refreshToken é null', async () => {
        req.body = { refreshToken: null };

        await controller.logout(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
          message: "Token de refresh não fornecido." 
        });
      });

      test('deve retornar erro 400 quando refreshToken é string vazia', async () => {
        req.body = { refreshToken: '' };

        await controller.logout(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
          message: "Token de refresh não fornecido." 
        });
      });

      test('deve retornar erro 400 quando token não é encontrado no banco', async () => {
        req.body = { refreshToken: 'inexistent.token' };
        mockService.deletarRefreshToken.mockResolvedValue({ deletedCount: 0 });

        await controller.logout(req, res, next);

        expect(mockService.deletarRefreshToken).toHaveBeenCalledWith('inexistent.token');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
          message: "Token não encontrado." 
        });
      });

      test('deve propagar erro quando service.deletarRefreshToken falha', async () => {
        req.body = { refreshToken: 'valid.token' };
        const serviceError = new Error('Erro de conexão com banco');
        mockService.deletarRefreshToken.mockRejectedValue(serviceError);

        await expect(controller.logout(req, res, next)).rejects.toThrow('Erro de conexão com banco');
        expect(mockService.deletarRefreshToken).toHaveBeenCalledWith('valid.token');
      });
    });
  });

  describe('Casos extremos e validações adicionais', () => {
    test('deve lidar com valores undefined em todos os métodos', async () => {
      // Test login com undefined
      req.body = { email: undefined, senha: undefined };
      const loginError = new AuthenticationError('Credenciais inválidas');
      mockService.autenticar.mockRejectedValue(loginError);
      
      await expect(controller.login(req, res, next)).rejects.toThrow(AuthenticationError);

      // Test refreshToken com undefined
      req.body = { refreshToken: undefined };
      await expect(controller.refreshToken(req, res, next)).rejects.toThrow(AuthenticationError);

      // Test logout com undefined
      req.body = { refreshToken: undefined };
      await controller.logout(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('deve preservar o comportamento assíncrono correto', async () => {
      const startTime = Date.now();
      
      req.body = { email: 'test@email.com', senha: 'password' };
      mockService.autenticar.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: '1' }), 100))
      );

      await controller.login(req, res, next);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    test('deve manter integridade dos dados através de múltiplas chamadas', async () => {
      const mockUser1 = { id: '1', email: 'user1@email.com' };
      const mockUser2 = { id: '2', email: 'user2@email.com' };

      // Primeira chamada
      req.body = { email: 'user1@email.com', senha: 'pass1' };
      mockService.autenticar.mockResolvedValueOnce(mockUser1);
      await controller.login(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Login realizado com sucesso.',
        ...mockUser1
      });

      // Reset mocks
      jest.clearAllMocks();
      res = createMockResponse();

      // Segunda chamada
      req.body = { email: 'user2@email.com', senha: 'pass2' };
      mockService.autenticar.mockResolvedValueOnce(mockUser2);
      await controller.login(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Login realizado com sucesso.',
        ...mockUser2
      });
    });
  });
});
