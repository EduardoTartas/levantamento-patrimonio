import AuthPermission from '@middlewares/AuthPermission';
import PermissionService from '@services/PermissionService';
import Rota from '@models/Rota';
import { CustomError, errorHandler, messages } from '@utils/helpers/index';

jest.mock('@services/PermissionService');
jest.mock('@models/Rota');
jest.mock('@utils/helpers/index', () => ({
  CustomError: jest.fn(),
  errorHandler: jest.fn(),
  messages: {
    error: {
      resourceNotFound: jest.fn()
    }
  }
}));

describe('AuthPermission', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
      url: '/usuarios',
      method: 'GET',
      hostname: 'localhost'
    };
    res = {};
    next = jest.fn();
    
    jest.clearAllMocks();
    
    // Mock das mensagens de erro
    messages.error.resourceNotFound.mockReturnValue('Recurso não encontrado');
  });

  test('deve lançar erro 401 se não houver userId', async () => {
    req.user = { _id: null };
    
    await AuthPermission(req, res, next);
    
    expect(CustomError).toHaveBeenCalledWith({
      statusCode: 401,
      errorType: 'authenticationError',
      field: 'Token',
      details: [],
      customMessage: 'Recurso não encontrado'
    });
    expect(errorHandler).toHaveBeenCalled();
  });

  test('deve lançar erro 401 se user não estiver definido', async () => {
    req.user = null;
    
    await AuthPermission(req, res, next);
    
    expect(CustomError).toHaveBeenCalledWith({
      statusCode: 401,
      errorType: 'authenticationError',
      field: 'Token',
      details: [],
      customMessage: 'Recurso não encontrado'
    });
    expect(errorHandler).toHaveBeenCalled();
  });

  test('deve lançar erro 404 se a rota não for encontrada no banco', async () => {
    Rota.findOne.mockResolvedValue(null);
    
    await AuthPermission(req, res, next);
    
    expect(Rota.findOne).toHaveBeenCalledWith({ 
      rota: 'usuarios', 
      dominio: 'localhost' 
    });
    expect(CustomError).toHaveBeenCalledWith({
      statusCode: 404,
      errorType: 'resourceNotFound',
      field: 'Rota',
      details: [],
      customMessage: 'Recurso não encontrado'
    });
    expect(errorHandler).toHaveBeenCalled();
  });

  test('deve lançar erro 403 se a rota não estiver ativa', async () => {
    Rota.findOne.mockResolvedValue({ ativo: false });
    
    await AuthPermission(req, res, next);
    
    expect(CustomError).toHaveBeenCalledWith({
      statusCode: 403,
      errorType: 'forbidden',
      field: 'Rota',
      details: [],
      customMessage: 'Recurso não encontrado'
    });
    expect(errorHandler).toHaveBeenCalled();
  });

  test('deve lançar erro 403 se o usuário não tiver permissão', async () => {
    Rota.findOne.mockResolvedValue({ ativo: true, dominio: 'localhost' });
    PermissionService.hasPermission.mockResolvedValue(false);
    
    await AuthPermission(req, res, next);
    
    expect(PermissionService.hasPermission).toHaveBeenCalledWith(
      'user123',
      'usuarios',
      'localhost',
      'buscar'
    );
    expect(CustomError).toHaveBeenCalledWith({
      statusCode: 403,
      errorType: 'forbidden',
      field: 'Permissão',
      details: [],
      customMessage: 'Recurso não encontrado'
    });
    expect(errorHandler).toHaveBeenCalled();
  });

  test('deve chamar next() quando o usuário tem permissão', async () => {
    Rota.findOne.mockResolvedValue({ ativo: true, dominio: 'localhost' });
    PermissionService.hasPermission.mockResolvedValue(true);
    
    await AuthPermission(req, res, next);
    
    expect(PermissionService.hasPermission).toHaveBeenCalledWith(
      'user123',
      'usuarios',
      'localhost',
      'buscar'
    );
    expect(req.user).toEqual({ _id: 'user123', id: 'user123' });
    expect(next).toHaveBeenCalledWith();
  });

  describe('Mapeamento de métodos HTTP', () => {
    beforeEach(() => {
      Rota.findOne.mockResolvedValue({ ativo: true, dominio: 'localhost' });
      PermissionService.hasPermission.mockResolvedValue(true);
    });

    test('deve mapear GET para "buscar"', async () => {
      req.method = 'GET';
      
      await AuthPermission(req, res, next);
      
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        'user123',
        'usuarios',
        'localhost',
        'buscar'
      );
    });

    test('deve mapear POST para "enviar"', async () => {
      req.method = 'POST';
      
      await AuthPermission(req, res, next);
      
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        'user123',
        'usuarios',
        'localhost',
        'enviar'
      );
    });

    test('deve mapear PUT para "substituir"', async () => {
      req.method = 'PUT';
      
      await AuthPermission(req, res, next);
      
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        'user123',
        'usuarios',
        'localhost',
        'substituir'
      );
    });

    test('deve mapear PATCH para "modificar"', async () => {
      req.method = 'PATCH';
      
      await AuthPermission(req, res, next);
      
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        'user123',
        'usuarios',
        'localhost',
        'modificar'
      );
    });

    test('deve mapear DELETE para "excluir"', async () => {
      req.method = 'DELETE';
      
      await AuthPermission(req, res, next);
      
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        'user123',
        'usuarios',
        'localhost',
        'excluir'
      );
    });
  });

  describe('Processamento de URL', () => {
    beforeEach(() => {
      Rota.findOne.mockResolvedValue({ ativo: true, dominio: 'localhost' });
      PermissionService.hasPermission.mockResolvedValue(true);
    });

    test('deve processar URL com query strings', async () => {
      req.url = '/usuarios?page=1&limit=10';
      
      await AuthPermission(req, res, next);
      
      expect(Rota.findOne).toHaveBeenCalledWith({ 
        rota: 'usuarios', 
        dominio: 'localhost' 
      });
    });

    test('deve processar URL com barras múltiplas', async () => {
      req.url = '//usuarios//profile//';
      
      await AuthPermission(req, res, next);
      
      expect(Rota.findOne).toHaveBeenCalledWith({ 
        rota: 'usuarios', 
        dominio: 'localhost' 
      });
    });

    test('deve usar localhost como domínio padrão quando hostname não está presente', async () => {
      delete req.hostname;
      
      await AuthPermission(req, res, next);
      
      expect(Rota.findOne).toHaveBeenCalledWith({ 
        rota: 'usuarios', 
        dominio: 'localhost' 
      });
    });
  });

  test('deve chamar errorHandler quando ocorrer erro não tratado', async () => {
    const mockError = new Error('Erro inesperado');
    Rota.findOne.mockRejectedValue(mockError);
    
    await AuthPermission(req, res, next);
    
    expect(errorHandler).toHaveBeenCalledWith(mockError, req, res, next);
  });
});