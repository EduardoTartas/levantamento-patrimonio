import SalaRepository from '@repositories/SalaRepository.js';
import Sala from '@models/Sala.js';
import SalaFilterBuilder from '@repositories/filters/SalaFilterBuild.js';
import { CustomError } from '@utils/helpers/CustomError.js';

jest.mock('@models/Sala.js');
jest.mock('@repositories/filters/SalaFilterBuild.js');

describe('SalaRepository', () => {
  let repo, mockFilterBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    Sala.findById = jest.fn();
    Sala.paginate = jest.fn();
    
    mockFilterBuilder = {
      comNome: jest.fn().mockReturnThis(),
      comCampus: jest.fn().mockReturnThis(),
      comBloco: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({})
    };
    SalaFilterBuilder.mockImplementation(() => mockFilterBuilder);
    repo = new SalaRepository();
  });

  describe('Constructor', () => {
    test('deve criar instância com model Sala', () => {
      expect(repo.model).toBe(Sala);
    });

    test('deve lançar erro se modelo não tem paginate', () => {
      Sala.paginate = undefined;
      expect(() => new SalaRepository()).toThrow(
        "The Bem model must include the paginate method. Ensure mongoose-paginate-v2 is applied."
      );
      Sala.paginate = jest.fn();
    });
  });

  describe('buscarPorId', () => {
    const mockSala = { _id: '507f1f77bcf86cd799439011', nome: 'Sala 101', bloco: 'A' };
    
    test('deve retornar sala quando encontrada', async () => {
      Sala.findById.mockResolvedValue(mockSala);
      const result = await repo.buscarPorId('507f1f77bcf86cd799439011');
      expect(result).toBe(mockSala);
      expect(Sala.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('deve retornar sala com dados completos', async () => {
      const completeSala = { ...mockSala, campus: '507f1f77bcf86cd799439012', createdAt: new Date() };
      Sala.findById.mockResolvedValue(completeSala);
      const result = await repo.buscarPorId('507f1f77bcf86cd799439011');
      expect(result).toEqual(completeSala);
    });

    test('deve lançar CustomError quando sala não encontrada', async () => {
      Sala.findById.mockResolvedValue(null);
      await expect(repo.buscarPorId('507f1f77bcf86cd799439011')).rejects.toThrow(CustomError);
    });

    test('deve lançar CustomError com ID inválido', async () => {
      Sala.findById.mockResolvedValue(null);
      await expect(repo.buscarPorId('id-invalido')).rejects.toThrow(CustomError);
    });

    test('deve propagar erro do banco de dados', async () => {
      const dbError = new Error('Database connection failed');
      Sala.findById.mockRejectedValue(dbError);
      await expect(repo.buscarPorId('507f1f77bcf86cd799439011')).rejects.toThrow('Database connection failed');
    });
  });

  describe('listar', () => {
    const mockResult = { docs: [{ nome: 'Sala 1' }], totalDocs: 1, limit: 10, page: 1 };
    
    describe('Com ID específico', () => {
      test('deve retornar sala específica com populate', async () => {
        const mockSala = { _id: '507f1f77bcf86cd799439011', nome: 'Sala 101' };
        const mockPopulate = jest.fn().mockResolvedValue(mockSala);
        Sala.findById.mockReturnValue({ populate: mockPopulate });

        const req = { params: { id: '507f1f77bcf86cd799439011' }, query: {} };
        const result = await repo.listar(req);

        expect(result).toBe(mockSala);
        expect(mockPopulate).toHaveBeenCalledWith({ path: 'campus', select: 'nome _id' });
      });

      test('deve lançar CustomError quando sala com ID não encontrada', async () => {
        const mockPopulate = jest.fn().mockResolvedValue(null);
        Sala.findById.mockReturnValue({ populate: mockPopulate });
        const req = { params: { id: '507f1f77bcf86cd799439011' }, query: {} };
        await expect(repo.listar(req)).rejects.toThrow(CustomError);
      });

      test('deve tratar erro no populate', async () => {
        const populateError = new Error('Populate failed');
        const mockPopulate = jest.fn().mockRejectedValue(populateError);
        Sala.findById.mockReturnValue({ populate: mockPopulate });
        const req = { params: { id: '507f1f77bcf86cd799439011' }, query: {} };
        await expect(repo.listar(req)).rejects.toThrow('Populate failed');
      });
    });

    describe('Listagem paginada', () => {
      test('deve retornar resultado paginado sem filtros', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: {} };
        const result = await repo.listar(req);

        expect(result).toBe(mockResult);
        expect(Sala.paginate).toHaveBeenCalledWith({}, {
          page: 1, populate: { path: 'campus', select: 'nome _id' }, limit: 10, sort: { nome: 1 }
        });
      });

      test('deve aplicar filtros com query parameters', async () => {
        const mockFilters = { nome: { $regex: 'Lab', $options: 'i' } };
        Sala.paginate.mockResolvedValue(mockResult);
        mockFilterBuilder.build.mockReturnValue(mockFilters);

        const req = { params: {}, query: { nome: 'Lab', campus: '507f1f77bcf86cd799439011', page: '2', limite: '5' } };
        const result = await repo.listar(req);

        expect(mockFilterBuilder.comNome).toHaveBeenCalledWith('Lab');
        expect(result).toBe(mockResult);
        expect(Sala.paginate).toHaveBeenCalledWith(mockFilters, expect.objectContaining({ page: 2, limit: 5 }));
      });

      test('deve limitar limite máximo a 100', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: { limite: '150' } };
        await repo.listar(req);
        expect(Sala.paginate).toHaveBeenCalledWith({}, expect.objectContaining({ limit: 100 }));
      });

      test('deve usar valores padrão para parâmetros inválidos', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: { page: 'invalid', limite: 'invalid' } };
        await repo.listar(req);
        expect(Sala.paginate).toHaveBeenCalledWith({}, expect.objectContaining({ page: 1, limit: 10 }));
      });

      test('deve tratar query undefined', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {} };
        const result = await repo.listar(req);

        expect(mockFilterBuilder.comNome).toHaveBeenCalledWith('');
        expect(result).toBe(mockResult);
      });
    });

    describe('Casos de erro', () => {
      test('deve lançar CustomError se filterBuilder.build não é função', async () => {
        mockFilterBuilder.build = undefined;
        const req = { params: {}, query: {} };
        await expect(repo.listar(req)).rejects.toThrow(CustomError);
      });

      test('deve lançar CustomError se filterBuilder.build não existe', async () => {
        mockFilterBuilder.build = null;
        const req = { params: {}, query: {} };
        await expect(repo.listar(req)).rejects.toThrow(CustomError);
      });

      test('deve propagar erro do paginate', async () => {
        const paginateError = new Error('Paginate failed');
        Sala.paginate.mockRejectedValue(paginateError);
        const req = { params: {}, query: {} };
        await expect(repo.listar(req)).rejects.toThrow('Paginate failed');
      });

      test('deve tratar erro na criação do filter builder', async () => {
        SalaFilterBuilder.mockImplementation(() => { throw new Error('Filter builder creation failed'); });
        const req = { params: {}, query: {} };
        await expect(repo.listar(req)).rejects.toThrow('Filter builder creation failed');
      });
    });

    describe('Edge cases', () => {
      test('deve lidar com params undefined', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { query: {} };
        const result = await repo.listar(req);
        expect(result).toBe(mockResult);
      });

      test('deve lidar com ID vazio', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: { id: '' }, query: {} };
        const result = await repo.listar(req);
        expect(result).toBe(mockResult);
      });

      test('deve aplicar ordenação padrão', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: {} };
        await repo.listar(req);
        const options = Sala.paginate.mock.calls[0][1];
        expect(options.sort).toEqual({ nome: 1 });
      });

      test('deve manter chaining do filter builder', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: { nome: 'Test', campus: 'Campus1', bloco: 'A' } };
        await repo.listar(req);

        expect(mockFilterBuilder.comNome).toHaveBeenCalledWith('Test');
        expect(mockFilterBuilder.comCampus).toHaveBeenCalledWith('Campus1');
        expect(mockFilterBuilder.comBloco).toHaveBeenCalledWith('A');
        expect(mockFilterBuilder.build).toHaveBeenCalled();
      });

      test('deve configurar populate corretamente', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: {} };
        await repo.listar(req);
        const options = Sala.paginate.mock.calls[0][1];
        expect(options.populate).toEqual({ path: 'campus', select: 'nome _id' });
      });

      test('deve tratar valores extremos nos parâmetros', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: { page: '0', limite: '-5' } };
        await repo.listar(req);
        expect(Sala.paginate).toHaveBeenCalledWith({}, expect.objectContaining({ page: 1, limit: 10 }));
      });

      test('deve aplicar filtros vazios quando parâmetros são strings vazias', async () => {
        Sala.paginate.mockResolvedValue(mockResult);
        const req = { params: {}, query: { nome: '', campus: '', bloco: '' } };
        await repo.listar(req);

        expect(mockFilterBuilder.comNome).toHaveBeenCalledWith('');
        expect(mockFilterBuilder.comCampus).toHaveBeenCalledWith('');
        expect(mockFilterBuilder.comBloco).toHaveBeenCalledWith('');
      });

      test('deve validar diferentes cenários de paginação', async () => {
        const testCases = [
          { query: { page: null }, expected: { page: 1 } },
          { query: { page: '999' }, expected: { page: 999 } },
          { query: { limite: '0' }, expected: { limit: 10 } },
          { query: { limite: '1' }, expected: { limit: 1 } }
        ];

        for (const testCase of testCases) {
          Sala.paginate.mockResolvedValue(mockResult);
          await repo.listar({ params: {}, query: testCase.query });
          expect(Sala.paginate).toHaveBeenCalledWith({}, expect.objectContaining(testCase.expected));
        }
      });

      test('deve preservar estrutura de resposta do paginate', async () => {
        const customResult = { docs: [], totalDocs: 0, hasNextPage: false, hasPrevPage: false };
        Sala.paginate.mockResolvedValue(customResult);
        const req = { params: {}, query: {} };
        const result = await repo.listar(req);
        expect(result).toEqual(customResult);
      });

      test('deve funcionar com filtros complexos', async () => {
        const complexFilters = { 
          nome: { $regex: 'complex', $options: 'i' }, 
          campus: '507f1f77bcf86cd799439011',
          bloco: { $regex: 'bloco', $options: 'i' }
        };
        mockFilterBuilder.build.mockReturnValue(complexFilters);
        Sala.paginate.mockResolvedValue(mockResult);
        
        const req = { params: {}, query: { nome: 'complex', campus: '507f1f77bcf86cd799439011', bloco: 'bloco' } };
        await repo.listar(req);
        
        expect(Sala.paginate).toHaveBeenCalledWith(complexFilters, expect.any(Object));
      });
    });
  });
});