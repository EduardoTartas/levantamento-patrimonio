import SalaRepository from '@repositories/SalaRepository';
import Sala from '@models/Sala.js';
import SalaFilterBuilder from '@repositories/filters/SalaFilterBuild.js';
import { CustomError } from '@utils/helpers/index.js';

jest.mock('@models/Sala.js');
jest.mock('@repositories/filters/SalaFilterBuild.js');

describe('SalaRepository', () => {
  let repo;

  beforeEach(() => {
    Sala.findById = jest.fn();
    Sala.paginate = jest.fn();

    SalaFilterBuilder.mockImplementation(() => ({
      comNome: jest.fn().mockReturnThis(),
      comCampus: jest.fn().mockReturnThis(),
      comBloco: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({
        nome: { $regex: 'Sala', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: 'B1', $options: 'i' },
      }),
    }));

    repo = new SalaRepository();
  });

  describe('constructor', () => {
    it('lança erro se o modelo não tem paginate', () => {
      Sala.paginate = undefined;
      expect(() => new SalaRepository()).toThrow(
        "The Bem model must include the paginate method. Ensure mongoose-paginate-v2 is applied."
      );
      // Restaurar para os outros testes
      Sala.paginate = jest.fn();
    });
  });

  describe('buscarPorId', () => {
    it('retorna sala se encontrada', async () => {
      const mockSala = { _id: '123', nome: 'Sala 1' };
      Sala.findById.mockResolvedValue(mockSala);

      const result = await repo.buscarPorId('123');
      expect(result).toBe(mockSala);
      expect(Sala.findById).toHaveBeenCalledWith('123');
    });

    it('lança CustomError se sala não encontrada', async () => {
      Sala.findById.mockResolvedValue(null);

      await expect(repo.buscarPorId('123')).rejects.toThrow(CustomError);
    });
  });

  describe('listar', () => {
    it('retorna sala quando id passado e encontrada', async () => {
      const mockSala = { _id: '123', nome: 'Sala X', campus: { nome: 'Campus A', _id: 'campusId' } };

      Sala.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSala),
      });

      const req = { params: { id: '123' }, query: {} };
      const result = await repo.listar(req);

      expect(result).toBe(mockSala);
      expect(Sala.findById).toHaveBeenCalledWith('123');
    });

    it('lança CustomError se id passado e sala não encontrada', async () => {
      Sala.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: '123' }, query: {} };
      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });

    it('lança CustomError se filterBuilder.build não é função', async () => {
      // Mock do SalaFilterBuilder com build undefined
      SalaFilterBuilder.mockImplementationOnce(() => ({
        comNome: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockReturnThis(),
        comBloco: jest.fn().mockReturnThis(),
        build: undefined,
      }));

      const req = { params: {}, query: {} };

      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });

    it('retorna resultado paginado para listagem geral', async () => {
      const mockPaginateResult = { docs: [{ nome: 'Sala 1' }], totalDocs: 1, limit: 10, page: 1 };
      Sala.paginate.mockResolvedValue(mockPaginateResult);

      const req = {
        params: {},
        query: { nome: 'Sala', campus: '507f1f77bcf86cd799439011', bloco: 'B1', page: '1', limite: '10' },
      };

      const result = await repo.listar(req);

      expect(result).toBe(mockPaginateResult);
      expect(Sala.paginate).toHaveBeenCalled();

      const calledFilter = Sala.paginate.mock.calls[0][0];
      expect(calledFilter).toHaveProperty('nome');
      expect(calledFilter).toHaveProperty('campus');
      expect(calledFilter).toHaveProperty('bloco');
    });
  });
});