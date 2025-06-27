import SalaController from '@controllers/SalaController.js';
import SalaService from '@services/SalaService.js';
import { CommonResponse } from '@utils/helpers/index.js';
import { SalaQuerySchema, SalaIdSchema } from '@utils/validators/schemas/zod/querys/SalaQuerySchema';

jest.mock('@services/SalaService.js');
jest.mock('@utils/helpers/index.js');
jest.mock('@utils/validators/schemas/zod/querys/SalaQuerySchema.js');

describe('SalaController', () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new SalaController();

    req = {
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock do CommonResponse.success para apenas registrar a chamada
    CommonResponse.success = jest.fn();

    // Mock do método listar do service
    SalaService.prototype.listar.mockResolvedValue(['sala1', 'sala2']);

    // Mock dos validadores Zod
    SalaIdSchema.parse = jest.fn();
    SalaQuerySchema.parseAsync = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar dados sem id e sem query', async () => {
    await controller.listar(req, res);

    expect(SalaIdSchema.parse).not.toHaveBeenCalled();
    expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
    expect(SalaService.prototype.listar).toHaveBeenCalledWith(req);
    expect(CommonResponse.success).toHaveBeenCalledWith(res, ['sala1', 'sala2']);
  });

  it('deve validar e listar com id no params', async () => {
    req.params.id = '123';

    await controller.listar(req, res);

    expect(SalaIdSchema.parse).toHaveBeenCalledWith('123');
    expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
    expect(SalaService.prototype.listar).toHaveBeenCalledWith(req);
    expect(CommonResponse.success).toHaveBeenCalledWith(res, ['sala1', 'sala2']);
  });

  it('deve validar e listar com query params', async () => {
    req.query = { nome: 'salaTeste' };

    await controller.listar(req, res);

    expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: 'salaTeste' });
    expect(SalaIdSchema.parse).not.toHaveBeenCalled();
    expect(SalaService.prototype.listar).toHaveBeenCalledWith(req);
    expect(CommonResponse.success).toHaveBeenCalledWith(res, ['sala1', 'sala2']);
  });

  it('deve lançar erro se validar id inválido', async () => {
    req.params.id = 'idInvalido';

    // Fazer o parse lançar erro
    SalaIdSchema.parse.mockImplementation(() => {
      throw new Error('ID inválido');
    });

    await expect(controller.listar(req, res)).rejects.toThrow('ID inválido');

    expect(SalaIdSchema.parse).toHaveBeenCalledWith('idInvalido');
    expect(CommonResponse.success).not.toHaveBeenCalled();
  });

  it('deve lançar erro se validar query inválida', async () => {
    req.query = { nome: '' };

    // Fazer o parseAsync lançar erro
    SalaQuerySchema.parseAsync.mockImplementation(() => {
      throw new Error('Query inválida');
    });

    await expect(controller.listar(req, res)).rejects.toThrow('Query inválida');

    expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: '' });
    expect(CommonResponse.success).not.toHaveBeenCalled();
  });
});
