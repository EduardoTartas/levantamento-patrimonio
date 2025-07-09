import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginService } from '@services/LoginService';
import AuthenticationError from '@utils/errors/AuthenticationError';
import TokenExpiredError from '@utils/errors/TokenExpiredError';
import TokenInvalidError from '@utils/errors/TokenInvalidError';
import CustomError from '@utils/helpers/CustomError';
import PasswordResetToken from '@models/PassResetToken';
import SendMail from '@utils/SendMail';
import TokenUtil from '@utils/TokenUtil';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@utils/SendMail');
jest.mock('@utils/TokenUtil');
jest.mock('@models/PassResetToken');

describe('LoginService', () => {
  let loginService;
  let mockLoginRepository;
  
  const mockConfig = {
    jwtSecret: 'test-secret',
    jwtExpireIn: '15m',
    jwtRefreshSecret: 'refresh-secret',
    jwtRefreshExpireIn: '7d',
    jwtPasswordResetSecret: 'reset-secret'
  };

  const mockUser = {
    _id: 'user123',
    nome: 'João Silva',
    email: 'joao@test.com',
    senha: 'hashedPassword',
    cargo: 'admin'
  };

  beforeEach(() => {
    mockLoginRepository = {
      buscarPorEmail: jest.fn(),
      buscarPorId: jest.fn(),
      salvarRefreshToken: jest.fn(),
      validarRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      atualizarSenha: jest.fn()
    };

    loginService = new LoginService(
      mockConfig.jwtSecret,
      mockConfig.jwtExpireIn,
      mockConfig.jwtRefreshSecret,
      mockConfig.jwtRefreshExpireIn,
      mockConfig.jwtPasswordResetSecret,
      mockLoginRepository
    );

    jest.clearAllMocks();
    process.env.RECUPERACAO_URL = 'http://test.com/reset';
  });

  describe('autenticar', () => {
    test('deve autenticar usuário com credenciais válidas', async () => {
      const email = 'joao@test.com';
      const senha = 'senha123';
      const accessToken = 'access.token';
      const refreshToken = 'refresh.token';

      mockLoginRepository.buscarPorEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      TokenUtil.generateAccessToken.mockReturnValue(accessToken);
      TokenUtil.generateRefreshToken.mockReturnValue(refreshToken);
      mockLoginRepository.salvarRefreshToken.mockResolvedValue();

      const result = await loginService.autenticar(email, senha);

      expect(mockLoginRepository.buscarPorEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(senha, mockUser.senha);
      expect(mockLoginRepository.salvarRefreshToken).toHaveBeenCalledWith(mockUser._id, refreshToken);
      expect(result).toEqual({
        usuario: {
          id: mockUser._id,
          nome: mockUser.nome,
          email: mockUser.email,
          cargo: mockUser.cargo
        },
        accessToken,
        refreshToken
      });
    });

    test('deve lançar erros para dados inválidos', async () => {
      await expect(loginService.autenticar('', 'senha')).rejects.toThrow(CustomError);
      await expect(loginService.autenticar('email-invalido', 'senha')).rejects.toThrow(CustomError);
    });

    test('deve lançar erro para usuário não encontrado', async () => {
      mockLoginRepository.buscarPorEmail.mockResolvedValue(null);
      await expect(loginService.autenticar('inexistente@test.com', 'senha')).rejects.toThrow(AuthenticationError);
    });

    test('deve lançar erro para senha incorreta', async () => {
      mockLoginRepository.buscarPorEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      await expect(loginService.autenticar('joao@test.com', 'senhaErrada')).rejects.toThrow(AuthenticationError);
    });

    test('deve propagar erros do repositório', async () => {
      mockLoginRepository.buscarPorEmail.mockRejectedValue(new Error('DB Error'));
      await expect(loginService.autenticar('joao@test.com', 'senha123')).rejects.toThrow('DB Error');
    });
  });

  describe('refreshToken', () => {
    const validToken = 'valid.refresh.token';
    const mockTokenData = { id: 'user123', iat: Math.floor(Date.now() / 1000) };

    test('deve renovar tokens com refresh token válido', async () => {
      const newAccessToken = 'new.access.token';
      const newRefreshToken = 'new.refresh.token';

      mockLoginRepository.validarRefreshToken.mockResolvedValue({ token: validToken });
      jwt.verify.mockReturnValue(mockTokenData);
      mockLoginRepository.buscarPorId.mockResolvedValue(mockUser);
      TokenUtil.generateAccessToken.mockReturnValue(newAccessToken);
      TokenUtil.generateRefreshToken.mockReturnValue(newRefreshToken);
      mockLoginRepository.deleteRefreshToken.mockResolvedValue();
      mockLoginRepository.salvarRefreshToken.mockResolvedValue();

      const result = await loginService.refreshToken(validToken);

      expect(mockLoginRepository.validarRefreshToken).toHaveBeenCalledWith(validToken);
      expect(jwt.verify).toHaveBeenCalledWith(validToken, mockConfig.jwtRefreshSecret);
      expect(mockLoginRepository.deleteRefreshToken).toHaveBeenCalledWith(validToken);
      expect(mockLoginRepository.salvarRefreshToken).toHaveBeenCalledWith(mockTokenData.id, newRefreshToken);
      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });

    test('deve lançar erro para token inválido', async () => {
      mockLoginRepository.validarRefreshToken.mockResolvedValue(null);
      await expect(loginService.refreshToken('invalid.token')).rejects.toThrow(CustomError);
    });

    test('deve lançar erro para JWT inválido', async () => {
      mockLoginRepository.validarRefreshToken.mockResolvedValue({ token: validToken });
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      await expect(loginService.refreshToken(validToken)).rejects.toThrow(TokenInvalidError);
    });

    test('deve lançar erro para sessão expirada', async () => {
      const expiredTokenData = { id: 'user123', iat: Math.floor((Date.now() - 8 * 24 * 60 * 60 * 1000) / 1000) };
      mockLoginRepository.validarRefreshToken.mockResolvedValue({ token: validToken });
      jwt.verify.mockReturnValue(expiredTokenData);
      await expect(loginService.refreshToken(validToken)).rejects.toThrow(CustomError);
    });
  });

  describe('solicitarRecuperacao', () => {
    test('deve enviar email de recuperação para usuário existente', async () => {
      const resetToken = 'reset.token';
      mockLoginRepository.buscarPorEmail.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue(resetToken);
      PasswordResetToken.create.mockResolvedValue();
      SendMail.enviaEmail.mockResolvedValue();

      const result = await loginService.solicitarRecuperacao('joao@test.com');

      expect(mockLoginRepository.buscarPorEmail).toHaveBeenCalledWith('joao@test.com');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id },
        mockConfig.jwtPasswordResetSecret,
        { expiresIn: '1hr' }
      );
      expect(PasswordResetToken.create).toHaveBeenCalled();
      expect(SendMail.enviaEmail).toHaveBeenCalled();
      expect(result).toEqual({ mensagem: "E-mail de recuperação enviado." });
    });

    test('deve lançar erro para usuário inexistente', async () => {
      mockLoginRepository.buscarPorEmail.mockResolvedValue(null);
      await expect(loginService.solicitarRecuperacao('inexistente@test.com')).rejects.toThrow(CustomError);
    });

    test('deve propagar erros de envio de email', async () => {
      mockLoginRepository.buscarPorEmail.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('token');
      PasswordResetToken.create.mockResolvedValue();
      SendMail.enviaEmail.mockRejectedValue(new Error('Email Error'));

      await expect(loginService.solicitarRecuperacao('joao@test.com')).rejects.toThrow('Email Error');
    });
  });

  describe('redefinirSenha', () => {
    const resetToken = 'reset.token';
    const novaSenha = 'novaSenha123';
    const hashedSenha = 'hashedNovaSenha';
    const mockResetTokenDoc = { used: false, expiresAt: new Date(Date.now() + 3600000), save: jest.fn() };

    test('deve redefinir senha com token válido', async () => {
      jwt.verify.mockReturnValue({ id: mockUser._id });
      PasswordResetToken.findOne.mockResolvedValue(mockResetTokenDoc);
      mockLoginRepository.buscarPorId.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue(hashedSenha);
      mockLoginRepository.atualizarSenha.mockResolvedValue();

      const result = await loginService.redefinirSenha(resetToken, novaSenha);

      expect(jwt.verify).toHaveBeenCalledWith(resetToken, mockConfig.jwtPasswordResetSecret);
      expect(PasswordResetToken.findOne).toHaveBeenCalledWith({ token: resetToken });
      expect(bcrypt.hash).toHaveBeenCalledWith(novaSenha, 10);
      expect(mockLoginRepository.atualizarSenha).toHaveBeenCalledWith(mockUser._id, hashedSenha);
      expect(mockResetTokenDoc.used).toBe(true);
      expect(mockResetTokenDoc.save).toHaveBeenCalled();
      expect(result).toEqual({ mensagem: "Senha alterada com sucesso." });
    });

    test('deve lançar erro para token expirado', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired'); 
        error.name = 'TokenExpiredError'; 
        throw error;
      });
      await expect(loginService.redefinirSenha(resetToken, novaSenha)).rejects.toThrow(TokenExpiredError);
    });

    test('deve lançar erro para token não encontrado', async () => {
      jwt.verify.mockReturnValue({ id: mockUser._id });
      PasswordResetToken.findOne.mockResolvedValue(null);
      await expect(loginService.redefinirSenha(resetToken, novaSenha)).rejects.toThrow(TokenInvalidError);
    });

    test('deve lançar erro para token já usado', async () => {
      jwt.verify.mockReturnValue({ id: mockUser._id });
      PasswordResetToken.findOne.mockResolvedValue({ ...mockResetTokenDoc, used: true });
      await expect(loginService.redefinirSenha(resetToken, novaSenha)).rejects.toThrow(TokenInvalidError);
    });
  });

  describe('deletarRefreshToken', () => {
    test('deve deletar refresh token', async () => {
      const refreshToken = 'refresh.token';
      const deleteResult = { deletedCount: 1 };
      mockLoginRepository.deleteRefreshToken.mockResolvedValue(deleteResult);

      const result = await loginService.deletarRefreshToken(refreshToken);

      expect(mockLoginRepository.deleteRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toBe(deleteResult);
    });

    test('deve propagar erros do repositório', async () => {
      mockLoginRepository.deleteRefreshToken.mockRejectedValue(new Error('Repository Error'));
      await expect(loginService.deletarRefreshToken('token')).rejects.toThrow('Repository Error');
    });
  });
});
