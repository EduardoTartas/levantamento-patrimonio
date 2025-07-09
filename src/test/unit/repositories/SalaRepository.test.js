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

  describe('buscarPorId', () => {
    const mockSala = { _id: '507f1f77bcf86cd799439011', nome: 'Sala 101', bloco: 'A' };
    
    test('deve retornar sala quando encontrada', async () => {
      Sala.findById.mockResolvedValue(mockSala);
      const result = await repo.buscarPorId('507f1f77bcf86cd799439011');
      expect(result).toBe(mockSala);
      expect(Sala.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('deve lançar CustomError quando sala não encontrada', async () => {
      Sala.findById.mockResolvedValue(null);
      await expect(repo.buscarPorId('507f1f77bcf86cd799439011')).rejects.toThrow(CustomError);
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

      test('deve propagar erro do paginate', async () => {
        const paginateError = new Error('Paginate failed');
        Sala.paginate.mockRejectedValue(paginateError);
        const req = { params: {}, query: {} };
        await expect(repo.listar(req)).rejects.toThrow('Paginate failed');
      });
    });
  });
});