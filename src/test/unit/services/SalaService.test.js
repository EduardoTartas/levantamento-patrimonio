import SalaService from '@services/SalaService.js';
import SalaRepository from '@repositories/SalaRepository.js';
import CustomError from '@utils/helpers/CustomError.js';
import messages from '@utils/helpers/messages.js';
import { HttpStatusCodes } from '@utils/helpers/index.js';

jest.mock('@repositories/SalaRepository.js');

describe('SalaService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRepository = {
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      deletar: jest.fn()
    };
    
    SalaRepository.mockImplementation(() => mockRepository);
    
    service = new SalaService();
  });

  describe('listar', () => {
    const mockReq = {
      params: { id: '123' },
      query: { nome: 'Sala', campus: '507f1f77bcf86cd799439011', page: 1, limite: 10 }
    };

    test('deve retornar resultado do repository.listar com parâmetros válidos', async () => {
      const mockResultado = {
        docs: [
          { _id: '1', nome: 'Sala A', campus: { _id: '123', nome: 'Campus Central' } },
          { _id: '2', nome: 'Sala B', campus: { _id: '123', nome: 'Campus Central' } }
        ],
        totalDocs: 2,
        totalPages: 1,
        page: 1,
        limit: 10
      };
      
      mockRepository.listar.mockResolvedValue(mockResultado);

      const resultado = await service.listar(mockReq);
      
      expect(resultado).toEqual(mockResultado);
      expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
    });

    test('deve funcionar com req vazio', async () => {
      const mockResultado = { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 };
      mockRepository.listar.mockResolvedValue(mockResultado);

      const resultado = await service.listar({});
      
      expect(resultado).toEqual(mockResultado);
      expect(mockRepository.listar).toHaveBeenCalledWith({});
    });

    test('deve propagar erro do repository', async () => {
      const erro = new Error('Erro do repository');
      mockRepository.listar.mockRejectedValue(erro);

      await expect(service.listar(mockReq)).rejects.toThrow(erro);
      expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
    });

    test('deve propagar CustomError do repository', async () => {
      const customError = new CustomError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Sala',
        details: [],
        customMessage: messages.error.internalServerError('Sala')
      });
      
      mockRepository.listar.mockRejectedValue(customError);

      await expect(service.listar(mockReq)).rejects.toThrow(CustomError);
      await expect(service.listar(mockReq)).rejects.toThrow(customError.message);
    });
  });

  describe('ensureSalaExists', () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockSala = {
      _id: validId,
      nome: 'Sala Teste',
      campus: { _id: '123', nome: 'Campus Central' },
      bloco: 'Bloco A',
      capacidade: 30
    };

    test('deve retornar sala quando ela existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockSala);

      const resultado = await service.ensureSalaExists(validId);

      expect(resultado).toBeDefined();
      expect(resultado).toEqual(mockSala);
      expect(mockRepository.buscarPorId).toHaveBeenCalledWith(validId);
    });

    test('deve funcionar com diferentes tipos de salas', async () => {
      const tiposSalas = [
        { _id: '1', nome: 'Laboratório', tipo: 'lab' },
        { _id: '2', nome: 'Auditório', tipo: 'auditorio', capacidade: 200 },
        { _id: '3', nome: 'Sala de Aula', tipo: 'aula', recursos: ['projetor', 'quadro'] }
      ];

      for (const sala of tiposSalas) {
        mockRepository.buscarPorId.mockResolvedValueOnce(sala);
        const resultado = await service.ensureSalaExists(sala._id);
        expect(resultado).toEqual(sala);
      }
    });

    test('deve lançar CustomError quando sala não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.ensureSalaExists('999')).rejects.toThrow(CustomError);
      
      try {
        await service.ensureSalaExists('999');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect(error.statusCode).toBe(HttpStatusCodes.NOT_FOUND.code);
        expect(error.errorType).toBe('resourceNotFound');
        expect(error.field).toBe('Sala');
        expect(error.customMessage).toBe(messages.error.resourceNotFound('Sala'));
        expect(error.details).toHaveLength(1);
        expect(error.details[0].path).toBe('id');
        expect(error.details[0].message).toBe('Sala não encontrado.');
      }
      
      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('999');
    });

    test('deve propagar erro do repository.buscarPorId', async () => {
      const erro = new Error('Erro de conexão com banco');
      mockRepository.buscarPorId.mockRejectedValue(erro);

      await expect(service.ensureSalaExists(validId)).rejects.toThrow(erro);
      expect(mockRepository.buscarPorId).toHaveBeenCalledWith(validId);
    });

    test('deve propagar CustomError do repository.buscarPorId', async () => {
      const customError = new CustomError({
        statusCode: 500,
        errorType: 'databaseError',
        field: 'Sala',
        details: [],
        customMessage: 'Erro interno do banco'
      });
      
      mockRepository.buscarPorId.mockRejectedValue(customError);

      await expect(service.ensureSalaExists(validId)).rejects.toThrow(CustomError);
      await expect(service.ensureSalaExists(validId)).rejects.toThrow(customError.message);
    });

    test('deve tratar retorno undefined do repository', async () => {
      mockRepository.buscarPorId.mockResolvedValue(undefined);

      await expect(service.ensureSalaExists(validId)).rejects.toThrow(CustomError);
      await expect(service.ensureSalaExists(validId)).rejects.toThrow(messages.error.resourceNotFound('Sala'));
    });

    test('deve tratar retorno false do repository', async () => {
      mockRepository.buscarPorId.mockResolvedValue(false);

      await expect(service.ensureSalaExists(validId)).rejects.toThrow(CustomError);
    });
  });
});
