import SalaService from '@services/SalaService.js';
import SalaRepository from '@repositories/SalaRepository.js';
import CustomError from '@utils/helpers/CustomError.js';
import messages from '@utils/helpers/messages.js';
import { HttpStatusCodes } from '@utils/helpers/index.js';

// Mock do SalaRepository
jest.mock('@repositories/SalaRepository.js');

describe('SalaService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do constructor do SalaRepository
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('deve criar instância do SalaService com repository', () => {
      expect(service).toBeInstanceOf(SalaService);
      expect(service.repository).toBeDefined();
      expect(SalaRepository).toHaveBeenCalledTimes(1);
    });

    test('deve inicializar repository corretamente', () => {
      const newService = new SalaService();
      expect(newService.repository).toBe(mockRepository);
      expect(SalaRepository).toHaveBeenCalledTimes(2); // 1 do beforeEach + 1 deste teste
    });
  });

  describe('listar', () => {
    const mockReq = {
      params: { id: '123' },
      query: { nome: 'Sala', campus: '507f1f77bcf86cd799439011', page: 1, limite: 10 }
    };

    describe('Casos de sucesso', () => {
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
        expect(mockRepository.listar).toHaveBeenCalledTimes(1);
      });

      test('deve funcionar com req vazio', async () => {
        const mockResultado = { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 };
        mockRepository.listar.mockResolvedValue(mockResultado);

        const resultado = await service.listar({});
        
        expect(resultado).toEqual(mockResultado);
        expect(mockRepository.listar).toHaveBeenCalledWith({});
      });

      test('deve funcionar com req undefined', async () => {
        const mockResultado = { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 };
        mockRepository.listar.mockResolvedValue(mockResultado);

        const resultado = await service.listar(undefined);
        
        expect(resultado).toEqual(mockResultado);
        expect(mockRepository.listar).toHaveBeenCalledWith(undefined);
      });

      test('deve retornar lista com diferentes tipos de dados', async () => {
        const mockResultados = [
          { docs: [], totalDocs: 0 }, // lista vazia
          { docs: [{ _id: '1', nome: 'Única Sala' }], totalDocs: 1 }, // lista com 1 item
          { docs: Array(50).fill().map((_, i) => ({ _id: i.toString(), nome: `Sala ${i}` })), totalDocs: 50 } // lista grande
        ];

        for (const mockResultado of mockResultados) {
          mockRepository.listar.mockResolvedValueOnce(mockResultado);
          const resultado = await service.listar(mockReq);
          expect(resultado).toEqual(mockResultado);
        }
        
        expect(mockRepository.listar).toHaveBeenCalledTimes(3);
      });

      test('deve funcionar com diferentes formatos de req', async () => {
        const mockResultado = { docs: [], totalDocs: 0 };
        mockRepository.listar.mockResolvedValue(mockResultado);

        const reqFormats = [
          { params: {}, query: {} },
          { params: { id: '123' } },
          { query: { nome: 'Test' } },
          { params: { id: '456' }, query: { campus: '789', limite: 5 } }
        ];

        for (const req of reqFormats) {
          const resultado = await service.listar(req);
          expect(resultado).toEqual(mockResultado);
        }
        
        expect(mockRepository.listar).toHaveBeenCalledTimes(4);
      });
    });

    describe('Casos de erro', () => {
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
        expect(mockRepository.listar).toHaveBeenCalledTimes(2);
      });

      test('deve propagar erro de validação do repository', async () => {
        const validationError = new Error('Validation failed');
        mockRepository.listar.mockRejectedValue(validationError);

        await expect(service.listar(mockReq)).rejects.toThrow(validationError);
      });

      test('deve propagar erro de conexão do banco', async () => {
        const dbError = new Error('Database connection failed');
        mockRepository.listar.mockRejectedValue(dbError);

        await expect(service.listar(mockReq)).rejects.toThrow(dbError);
      });
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

    describe('Casos de sucesso', () => {
      test('deve retornar sala quando ela existir', async () => {
        mockRepository.buscarPorId.mockResolvedValue(mockSala);

        const resultado = await service.ensureSalaExists(validId);

        expect(resultado).toBeDefined();
        expect(resultado).toEqual(mockSala);
        expect(mockRepository.buscarPorId).toHaveBeenCalledWith(validId);
        expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(1);
      });

      test('deve funcionar com diferentes tipos de salas', async () => {
        const tiposSalas = [
          { _id: '1', nome: 'Laboratório', tipo: 'lab' },
          { _id: '2', nome: 'Auditório', tipo: 'auditorio', capacidade: 200 },
          { _id: '3', nome: 'Sala de Aula', tipo: 'aula', recursos: ['projetor', 'quadro'] },
          { _id: '4', nome: 'Biblioteca', tipo: 'biblioteca', silenciosa: true }
        ];

        for (const sala of tiposSalas) {
          mockRepository.buscarPorId.mockResolvedValueOnce(sala);
          const resultado = await service.ensureSalaExists(sala._id);
          expect(resultado).toEqual(sala);
        }
        
        expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(4);
      });

      test('deve funcionar com diferentes formatos de ID válidos', async () => {
        const idsValidos = [
          '507f1f77bcf86cd799439011',
          '123456789012345678901234',
          'abcdefabcdefabcdefabcdef',
          '000000000000000000000000'
        ];

        for (const id of idsValidos) {
          mockRepository.buscarPorId.mockResolvedValueOnce({ _id: id, nome: `Sala ${id}` });
          const resultado = await service.ensureSalaExists(id);
          expect(resultado._id).toBe(id);
        }
        
        expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(4);
      });

      test('deve retornar sala com dados completos', async () => {
        const salaCompleta = {
          _id: validId,
          nome: 'Sala Completa',
          campus: {
            _id: '123',
            nome: 'Campus Central',
            endereco: 'Rua A, 123'
          },
          bloco: 'Bloco Administrativo',
          andar: 2,
          capacidade: 40,
          recursos: ['projetor', 'ar-condicionado', 'lousa digital'],
          ativa: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        mockRepository.buscarPorId.mockResolvedValue(salaCompleta);

        const resultado = await service.ensureSalaExists(validId);
        
        expect(resultado).toEqual(salaCompleta);
        expect(resultado.campus).toBeDefined();
        expect(resultado.recursos).toBeInstanceOf(Array);
      });
    });

    describe('Casos de erro', () => {
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

      test('deve lançar CustomError com dados corretos para diferentes IDs inexistentes', async () => {
        const idsInexistentes = ['111', '222', '333', 'inexistente'];
        
        for (const id of idsInexistentes) {
          mockRepository.buscarPorId.mockResolvedValueOnce(null);
          
          await expect(service.ensureSalaExists(id)).rejects.toThrow(CustomError);
          await expect(service.ensureSalaExists(id)).rejects.toThrow(messages.error.resourceNotFound('Sala'));
        }
        
        expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(8); // 4 ids * 2 calls each
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

      test('deve tratar erro de validação de ID', async () => {
        const validationError = new Error('Invalid ObjectId format');
        mockRepository.buscarPorId.mockRejectedValue(validationError);

        await expect(service.ensureSalaExists('invalid-id')).rejects.toThrow(validationError);
      });

      test('deve tratar diferentes tipos de erro do repository', async () => {
        const tiposDeErro = [
          new Error('Network timeout'),
          new Error('Permission denied'),
          new Error('Resource locked'),
          new TypeError('Invalid argument type')
        ];

        for (const erro of tiposDeErro) {
          mockRepository.buscarPorId.mockRejectedValueOnce(erro);
          await expect(service.ensureSalaExists(validId)).rejects.toThrow(erro);
        }
        
        expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(4);
      });
    });

    describe('Casos extremos', () => {
      test('deve funcionar com ID como string vazia', async () => {
        const erro = new Error('Invalid ID');
        mockRepository.buscarPorId.mockRejectedValue(erro);

        await expect(service.ensureSalaExists('')).rejects.toThrow(erro);
        expect(mockRepository.buscarPorId).toHaveBeenCalledWith('');
      });

      test('deve funcionar com ID null', async () => {
        const erro = new Error('Invalid ID');
        mockRepository.buscarPorId.mockRejectedValue(erro);

        await expect(service.ensureSalaExists(null)).rejects.toThrow(erro);
        expect(mockRepository.buscarPorId).toHaveBeenCalledWith(null);
      });

      test('deve funcionar com ID undefined', async () => {
        const erro = new Error('Invalid ID');
        mockRepository.buscarPorId.mockRejectedValue(erro);

        await expect(service.ensureSalaExists(undefined)).rejects.toThrow(erro);
        expect(mockRepository.buscarPorId).toHaveBeenCalledWith(undefined);
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

      test('deve tratar retorno 0 do repository', async () => {
        mockRepository.buscarPorId.mockResolvedValue(0);

        await expect(service.ensureSalaExists(validId)).rejects.toThrow(CustomError);
      });

      test('deve tratar retorno string vazia do repository', async () => {
        mockRepository.buscarPorId.mockResolvedValue('');

        await expect(service.ensureSalaExists(validId)).rejects.toThrow(CustomError);
      });
    });
  });

  describe('Integração entre métodos', () => {
    test('deve funcionar corretamente quando listar é chamado depois de ensureSalaExists', async () => {
      const mockSala = { _id: '123', nome: 'Sala Teste' };
      const mockLista = { docs: [mockSala], totalDocs: 1 };
      
      mockRepository.buscarPorId.mockResolvedValue(mockSala);
      mockRepository.listar.mockResolvedValue(mockLista);

      const salaExistente = await service.ensureSalaExists('123');
      const lista = await service.listar({});

      expect(salaExistente).toEqual(mockSala);
      expect(lista).toEqual(mockLista);
      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('123');
      expect(mockRepository.listar).toHaveBeenCalledWith({});
    });

    test('deve manter estado independente entre chamadas', async () => {
      mockRepository.buscarPorId.mockResolvedValue({ _id: '1', nome: 'Sala 1' });
      mockRepository.listar.mockResolvedValue({ docs: [], totalDocs: 0 });

      const resultado1 = await service.ensureSalaExists('1');
      const resultado2 = await service.listar({});
      const resultado3 = await service.ensureSalaExists('1');

      expect(resultado1).toEqual(resultado3);
      expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(2);
      expect(mockRepository.listar).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases e robustez', () => {
    test('deve funcionar com múltiplas instâncias do service', () => {
      // Resetar o contador do mock antes do teste
      jest.clearAllMocks();
      
      const service1 = new SalaService();
      const service2 = new SalaService();
      
      expect(service1).not.toBe(service2);
      expect(service1.repository).toBeDefined();
      expect(service2.repository).toBeDefined();
      expect(SalaRepository).toHaveBeenCalledTimes(2); // 2 novas instâncias
    });

    test('deve manter referência do repository após múltiplas operações', async () => {
      mockRepository.listar.mockResolvedValue({ docs: [] });
      mockRepository.buscarPorId.mockResolvedValue({ _id: '1', nome: 'Teste' });

      await service.listar({});
      await service.ensureSalaExists('1');
      await service.listar({});

      expect(service.repository).toBe(mockRepository);
      expect(mockRepository.listar).toHaveBeenCalledTimes(2);
      expect(mockRepository.buscarPorId).toHaveBeenCalledTimes(1);
    });
  });
});
