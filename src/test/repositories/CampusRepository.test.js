// CampusRepository.test.js
import CampusRepository from '@repositories/CampusRepository.js';
import CampusFilterBuilder from '@repositories/filters/CampusFilterBuilder.js';
import { CustomError, messages } from '@utils/helpers';
import Campus from '@models/Campus.js';
import Usuario from '@models/Usuario';

jest.mock('@models/Campus.js');
jest.mock('@models/Usuario');
jest.mock('@repositories/filters/CampusFilterBuilder.js');

describe('CampusRepository', () => {
  let repo;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock paginate method for Campus
    Campus.paginate = jest.fn();

    // Mock constructor for Campus (new Campus())
    Campus.mockImplementation((data) => ({
      save: jest.fn().mockResolvedValue(data),
    }));

    repo = new CampusRepository();
  });

  test('constructor throws error if paginate is missing', () => {
    delete Campus.paginate;
    expect(() => new CampusRepository()).toThrow(
      /must include the paginate method/
    );
  });

  describe('buscarPorNome', () => {
    test('findOne called with nome only', async () => {
      Campus.findOne = jest.fn().mockResolvedValue('campus1');
      const result = await repo.buscarPorNome('UFRO');
      expect(Campus.findOne).toHaveBeenCalledWith({ nome: 'UFRO' });
      expect(result).toBe('campus1');
    });

    test('findOne called with nome and cidade', async () => {
      Campus.findOne = jest.fn().mockResolvedValue('campus2');
      const result = await repo.buscarPorNome('UFRO', 'Vilhena');
      expect(Campus.findOne).toHaveBeenCalledWith({
        nome: 'UFRO',
        cidade: 'Vilhena',
      });
      expect(result).toBe('campus2');
    });

    test('findOne called with nome and idDiferente', async () => {
      Campus.findOne = jest.fn().mockResolvedValue('campus3');
      const result = await repo.buscarPorNome('UFRO', null, '123');
      expect(Campus.findOne).toHaveBeenCalledWith({
        nome: 'UFRO',
        _id: { $ne: '123' },
      });
      expect(result).toBe('campus3');
    });
  });

  describe('buscarPorId', () => {
    test('returns campus if found', async () => {
      Campus.findById = jest.fn().mockResolvedValue('campus1');
      const result = await repo.buscarPorId('id1');
      expect(Campus.findById).toHaveBeenCalledWith('id1');
      expect(result).toBe('campus1');
    });

    test('throws CustomError if not found', async () => {
      Campus.findById = jest.fn().mockResolvedValue(null);
      await expect(repo.buscarPorId('id1')).rejects.toThrow(CustomError);
    });
  });

  describe('listar', () => {
    test('returns data when id is provided and found', async () => {
      const req = { params: { id: 'abc' }, query: {} };
      Campus.findById = jest.fn().mockResolvedValue('campusData');
      const result = await repo.listar(req);
      expect(Campus.findById).toHaveBeenCalledWith('abc');
      expect(result).toBe('campusData');
    });

    test('throws error if id provided but not found', async () => {
      const req = { params: { id: 'abc' }, query: {} };
      Campus.findById = jest.fn().mockResolvedValue(null);
      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });

    test('uses filterBuilder and paginate when no id provided', async () => {
      const req = {
        params: {},
        query: { nome: 'N', cidade: 'C', ativo: 'true', page: '2', limite: '50' },
      };

      const mockFilterBuilderInstance = {
        comNome: jest.fn().mockReturnThis(),
        comCidade: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ nome: 'N' }),
      };
      CampusFilterBuilder.mockImplementation(() => mockFilterBuilderInstance);
      Campus.paginate.mockResolvedValue('paginatedResult');

      const result = await repo.listar(req);

      expect(mockFilterBuilderInstance.comNome).toHaveBeenCalledWith('N');
      expect(mockFilterBuilderInstance.comCidade).toHaveBeenCalledWith('C');
      expect(mockFilterBuilderInstance.comAtivo).toHaveBeenCalledWith('true');
      expect(mockFilterBuilderInstance.build).toHaveBeenCalled();

      expect(Campus.paginate).toHaveBeenCalledWith(
        { nome: 'N' },
        { page: 2, limit: 50, sort: { nome: 1 } }
      );

      expect(result).toBe('paginatedResult');
    });

    test('throws error if filterBuilder.build is not a function', async () => {
      const req = { params: {}, query: {} };

      const badFilterBuilder = {
        comNome: jest.fn().mockReturnThis(),
        comCidade: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        build: null, // invalid
      };
      CampusFilterBuilder.mockImplementation(() => badFilterBuilder);

      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });
  });

  describe('criar', () => {
    test('saves new campus', async () => {
      const saveMock = jest.fn().mockResolvedValue('savedCampus');
      Campus.mockImplementation(() => ({ save: saveMock }));
      const data = { nome: 'UFRO' };
      const result = await repo.criar(data);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBe('savedCampus');
    });
  });

  describe('atualizar', () => {
    test('returns updated campus if found', async () => {
      Campus.findByIdAndUpdate = jest.fn().mockResolvedValue('updatedCampus');
      const result = await repo.atualizar('id1', { nome: 'Novo Nome' });
      expect(Campus.findByIdAndUpdate).toHaveBeenCalledWith('id1', { nome: 'Novo Nome' }, { new: true });
      expect(result).toBe('updatedCampus');
    });

    test('throws CustomError if campus not found', async () => {
      Campus.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(repo.atualizar('id1', {})).rejects.toThrow(CustomError);
    });
  });

  describe('deletar', () => {
    test('returns deleted campus if found', async () => {
      Campus.findByIdAndDelete = jest.fn().mockResolvedValue('deletedCampus');
      const result = await repo.deletar('id1');
      expect(Campus.findByIdAndDelete).toHaveBeenCalledWith('id1');
      expect(result).toBe('deletedCampus');
    });

    test('throws CustomError if campus not found', async () => {
      Campus.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      await expect(repo.deletar('id1')).rejects.toThrow(CustomError);
    });
  });

  describe('verificarUsuariosAssociados', () => {
    test('calls Usuario.findOne with campus id', async () => {
      Usuario.findOne = jest.fn().mockResolvedValue('usuario1');
      const result = await repo.verificarUsuariosAssociados('campusId');
      expect(Usuario.findOne).toHaveBeenCalledWith({ campus: 'campusId' });
      expect(result).toBe('usuario1');
    });
  });
});
