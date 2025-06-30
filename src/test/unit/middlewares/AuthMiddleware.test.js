import AuthMiddleware from '@middlewares/AuthMiddleware';
import Usuario from '@models/Usuario';
import AuthenticationError from '@utils/errors/AuthenticationError';
import TokenExpiredError from '@utils/errors/TokenExpiredError';
import { promisify } from 'util';

jest.mock('jsonwebtoken');
jest.mock('@models/Usuario');
jest.mock('util');

describe('AuthMiddleware', () => {
  let req, res, next;
  let mockPromisify;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    
    // Mock do promisify
    mockPromisify = jest.fn();
    promisify.mockReturnValue(mockPromisify);
    
    jest.clearAllMocks();
  });

  test('deve lançar AuthenticationError se não houver header Authorization', async () => {
    await AuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toMatch(/token de autenticação não existe/i);
  });

  test('deve lançar AuthenticationError se o formato do token for inválido', async () => {
    req.headers.authorization = 'InvalidTokenFormat';
    await AuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toMatch(/formato do token de autenticação inválido/i);
  });

  test('deve lançar AuthenticationError se jwt.verify lançar JsonWebTokenError', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    mockPromisify.mockRejectedValue(error);
    
    await AuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toMatch(/token jwt inválido/i);
  });

  test('deve lançar TokenExpiredError se jwt.verify lançar TokenExpiredError', async () => {
    req.headers.authorization = 'Bearer expiredtoken';
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    mockPromisify.mockRejectedValue(error);
    
    await AuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(TokenExpiredError);
    expect(err.message).toMatch(/token jwt está expirado/i);
  });

  test('deve lançar AuthenticationError se o usuário não for encontrado', async () => {
    req.headers.authorization = 'Bearer validtoken';
    mockPromisify.mockResolvedValue({ id: '123' });
    Usuario.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await AuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toMatch(/usuário não encontrado/i);
  });

  test('deve anexar req.user e chamar next quando o token e usuário forem válidos', async () => {
    req.headers.authorization = 'Bearer validtoken';
    mockPromisify.mockResolvedValue({ id: '123' });
    const mockUser = {
      _id: '123',
      cargo: 'admin',
      nome: 'Usuário Teste',
      email: 'teste@email.com',
    };
    Usuario.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    await AuthMiddleware(req, res, next);

    expect(req.user).toEqual({
      _id: '123',
      cargo: 'admin',
      nome: 'Usuário Teste',
      email: 'teste@email.com',
    });
    expect(next).toHaveBeenCalledWith();
  });
});
