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

  it('construtor lança erro se o método paginate estiver ausente', () => {
    delete Campus.paginate;
    expect(() => new CampusRepository()).toThrow(
      /must include the paginate method/
    );
  });

  describe('buscarPorNome', () => {
    it('findOne é chamado apenas com nome', async () => {
      Campus.findOne = jest.fn().mockResolvedValue('campus1');
      const result = await repo.buscarPorNome('UFRO');
      expect(Campus.findOne).toHaveBeenCalledWith({ nome: 'UFRO' });
      expect(result).toBe('campus1');
    });

    it('findOne é chamado com nome e cidade', async () => {
      Campus.findOne = jest.fn().mockResolvedValue('campus2');
      const result = await repo.buscarPorNome('UFRO', 'Vilhena');
      expect(Campus.findOne).toHaveBeenCalledWith({
        nome: 'UFRO',
        cidade: 'Vilhena',
      });
      expect(result).toBe('campus2');
    });

    it('findOne é chamado com nome e idDiferente', async () => {
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
    it('retorna o campus se encontrado', async () => {
      Campus.findById = jest.fn().mockResolvedValue('campus1');
      const result = await repo.buscarPorId('id1');
      expect(Campus.findById).toHaveBeenCalledWith('id1');
      expect(result).toBe('campus1');
    });

    it('lança CustomError se não encontrado', async () => {
      Campus.findById = jest.fn().mockResolvedValue(null);
      await expect(repo.buscarPorId('id1')).rejects.toThrow(CustomError);
    });
  });

  describe('listar', () => {
    it('retorna dados quando o id é fornecido e encontrado', async () => {
      const req = { params: { id: 'abc' }, query: {} };
      Campus.findById = jest.fn().mockResolvedValue('campusData');
      const result = await repo.listar(req);
      expect(Campus.findById).toHaveBeenCalledWith('abc');
      expect(result).toBe('campusData');
    });

    it('lança erro se o id for fornecido mas não encontrado', async () => {
      const req = { params: { id: 'abc' }, query: {} };
      Campus.findById = jest.fn().mockResolvedValue(null);
      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });

    it('usa filterBuilder e paginate quando nenhum id é fornecido', async () => {
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

    it('lança erro se filterBuilder.build não for uma função', async () => {
      const req = { params: {}, query: {} };

      const badFilterBuilder = {
        comNome: jest.fn().mockReturnThis(),
        comCidade: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        build: null, // inválido
      };
      CampusFilterBuilder.mockImplementation(() => badFilterBuilder);

      await expect(repo.listar(req)).rejects.toThrow(CustomError);
    });
  });

  describe('criar', () => {
    it('salva novo campus', async () => {
      const saveMock = jest.fn().mockResolvedValue('savedCampus');
      Campus.mockImplementation(() => ({ save: saveMock }));
      const data = { nome: 'UFRO' };
      const result = await repo.criar(data);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBe('savedCampus');
    });
  });

  describe('atualizar', () => {
    it('retorna campus atualizado se encontrado', async () => {
      Campus.findByIdAndUpdate = jest.fn().mockResolvedValue('updatedCampus');
      const result = await repo.atualizar('id1', { nome: 'Novo Nome' });
      expect(Campus.findByIdAndUpdate).toHaveBeenCalledWith('id1', { nome: 'Novo Nome' }, { new: true });
      expect(result).toBe('updatedCampus');
    });

    it('lança CustomError se o campus não for encontrado', async () => {
      Campus.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(repo.atualizar('id1', {})).rejects.toThrow(CustomError);
    });
  });

  describe('deletar', () => {
    it('retorna campus deletado se encontrado', async () => {
      Campus.findByIdAndDelete = jest.fn().mockResolvedValue('deletedCampus');
      const result = await repo.deletar('id1');
      expect(Campus.findByIdAndDelete).toHaveBeenCalledWith('id1');
      expect(result).toBe('deletedCampus');
    });

    it('lança CustomError se o campus não for encontrado', async () => {
      Campus.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      await expect(repo.deletar('id1')).rejects.toThrow(CustomError);
    });
  });

  describe('verificarUsuariosAssociados', () => {
    it('chama Usuario.findOne com o id do campus', async () => {
      Usuario.findOne = jest.fn().mockResolvedValue('usuario1');
      const result = await repo.verificarUsuariosAssociados('campusId');
      expect(Usuario.findOne).toHaveBeenCalledWith({ campus: 'campusId' });
      expect(result).toBe('usuario1');
    });
  });
});