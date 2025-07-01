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
  let mockSalaService;

  beforeEach(() => {
    mockSalaService = {
      listar: jest.fn()
    };
    SalaService.mockImplementation(() => mockSalaService);
    
    controller = new SalaController();
    // Substituir o service após a criação
    controller.service = mockSalaService;

    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    CommonResponse.success = jest.fn();
    CommonResponse.error = jest.fn();
    SalaIdSchema.parse = jest.fn();
    SalaQuerySchema.parseAsync = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('deve criar instância do SalaController com service', () => {
      const newController = new SalaController();
      expect(newController).toBeInstanceOf(SalaController);
      expect(newController.service).toBeDefined();
    });
  });

  describe('listar', () => {
    const mockSalas = [
      { id: 1, nome: 'Sala A', capacidade: 30 },
      { id: 2, nome: 'Sala B', capacidade: 25 }
    ];

    describe('Casos de sucesso', () => {
      test('deve listar salas sem parâmetros', async () => {
        controller.service.listar.mockResolvedValue(mockSalas);

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).not.toHaveBeenCalled();
        expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve listar sala específica com ID válido', async () => {
        req.params.id = '123';
        const mockSala = { id: 123, nome: 'Sala Específica' };
        controller.service.listar.mockResolvedValue(mockSala);
        SalaIdSchema.parse.mockReturnValue('123');

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('123');
        expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSala);
      });

      test('deve listar salas com query parameters válidos', async () => {
        req.query = { nome: 'Sala A', capacidade: 30 };
        controller.service.listar.mockResolvedValue(mockSalas);
        SalaQuerySchema.parseAsync.mockResolvedValue(req.query);

        await controller.listar(req, res);

        expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        expect(SalaIdSchema.parse).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve listar com ID e query simultaneamente', async () => {
        req.params.id = '456';
        req.query = { includeDetails: true };
        const mockResult = { id: 456, nome: 'Sala Detalhada', detalhes: {} };
        controller.service.listar.mockResolvedValue(mockResult);
        SalaIdSchema.parse.mockReturnValue('456');
        SalaQuerySchema.parseAsync.mockResolvedValue(req.query);

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('456');
        expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockResult);
      });

      test('deve retornar array vazio quando não há salas', async () => {
        controller.service.listar.mockResolvedValue([]);

        await controller.listar(req, res);

        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, []);
      });

      test('deve listar com diferentes tipos de query', async () => {
        const queries = [
          { nome: 'Laboratório' },
          { capacidade: { $gte: 20 } },
          { ativo: true }
        ];

        for (const query of queries) {
          req.query = query;
          controller.service.listar.mockResolvedValue(mockSalas);
          SalaQuerySchema.parseAsync.mockResolvedValue(query);
          await controller.listar(req, res);
          expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(query);
        }
      });
    });

    describe('Casos de erro', () => {
      test('deve lançar erro para ID inválido', async () => {
        req.params.id = 'id-invalido';
        const error = new Error('ID deve ser um ObjectId válido');
        SalaIdSchema.parse.mockImplementation(() => { throw error; });

        await expect(controller.listar(req, res)).rejects.toThrow('ID deve ser um ObjectId válido');

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('id-invalido');
        expect(controller.service.listar).not.toHaveBeenCalled();
        expect(CommonResponse.success).not.toHaveBeenCalled();
      });

      test('deve lançar erro para query inválida', async () => {
        req.query = { nome: '', capacidade: 'invalid' };
        const error = new Error('Query parameters inválidos');
        SalaQuerySchema.parseAsync.mockRejectedValue(error);

        await expect(controller.listar(req, res)).rejects.toThrow('Query parameters inválidos');

        expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        expect(controller.service.listar).not.toHaveBeenCalled();
        expect(CommonResponse.success).not.toHaveBeenCalled();
      });

      test('deve propagar erro do service', async () => {
        const serviceError = new Error('Erro interno do service');
        controller.service.listar.mockRejectedValue(serviceError);

        await expect(controller.listar(req, res)).rejects.toThrow('Erro interno do service');

        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).not.toHaveBeenCalled();
      });

      test('deve lidar com erro de validação de schema', async () => {
        req.query = { limit: -1, offset: 'invalid' };
        const validationError = {
          name: 'ZodError',
          issues: [
            { path: ['limit'], message: 'Limite deve ser positivo' },
            { path: ['offset'], message: 'Offset deve ser um número' }
          ]
        };
        SalaQuerySchema.parseAsync.mockRejectedValue(validationError);

        await expect(controller.listar(req, res)).rejects.toEqual(validationError);

        expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        expect(controller.service.listar).not.toHaveBeenCalled();
      });

      test('deve lidar com diferentes tipos de erro do service', async () => {
        const errors = [
          new Error('Conexão com banco falhou'),
          { message: 'Timeout na consulta', code: 'TIMEOUT' },
          new TypeError('Tipo inválido')
        ];

        for (const error of errors) {
          controller.service.listar.mockRejectedValue(error);
          await expect(controller.listar(req, res)).rejects.toEqual(error);
        }
      });
    });

    describe('Edge cases', () => {
      test('deve lidar com req.params undefined', async () => {
        req.params = undefined;
        controller.service.listar.mockResolvedValue(mockSalas);

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve lidar com req.query undefined', async () => {
        req.query = undefined;
        controller.service.listar.mockResolvedValue(mockSalas);

        await controller.listar(req, res);

        expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve lidar com query vazia', async () => {
        req.query = {};
        controller.service.listar.mockResolvedValue(mockSalas);

        await controller.listar(req, res);

        expect(SalaQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve lidar com ID zero', async () => {
        req.params.id = '0';
        controller.service.listar.mockResolvedValue(null);
        SalaIdSchema.parse.mockReturnValue('0');

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('0');
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, null);
      });

      test('deve lidar com caracteres especiais no ID', async () => {
        req.params.id = '507f1f77bcf86cd799439011';
        controller.service.listar.mockResolvedValue(mockSalas[0]);
        SalaIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas[0]);
      });
    });

    describe('Validação e integração', () => {
      test('deve chamar validações na ordem correta', async () => {
        req.params.id = '123';
        req.query = { nome: 'test' };
        controller.service.listar.mockResolvedValue(mockSalas);
        SalaIdSchema.parse.mockReturnValue('123');
        SalaQuerySchema.parseAsync.mockResolvedValue(req.query);

        await controller.listar(req, res);

        expect(SalaIdSchema.parse).toHaveBeenCalledWith('123');
        expect(SalaQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve preservar contexto da requisição', async () => {
        req.user = { id: 'user123', role: 'admin' };
        req.headers = { 'x-request-id': 'req-456' };
        controller.service.listar.mockResolvedValue(mockSalas);

        await controller.listar(req, res);

        expect(controller.service.listar).toHaveBeenCalledWith(req);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockSalas);
      });

      test('deve manter performance adequada', async () => {
        const startTime = Date.now();
        controller.service.listar.mockResolvedValue(mockSalas);
        await controller.listar(req, res);
        expect(Date.now() - startTime).toBeLessThan(100);
      });
    });
  });
});
