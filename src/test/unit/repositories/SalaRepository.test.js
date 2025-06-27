// src/test/unit/repositories/SalaRepository.test.js

import Sala from '@models/Sala.js';
import SalaRepository from '@repositories/SalaRepository.js';

jest.mock('@models/Sala.js', () => ({
  findById: jest.fn(),
  paginate: jest.fn()
}));

// Mock funcional de SalaFilterBuilder
const mockComNome = jest.fn().mockReturnThis();
const mockComCampus = jest.fn().mockReturnThis();
const mockComBloco = jest.fn().mockReturnThis();
const mockBuild = jest.fn().mockReturnValue({});

jest.mock('@repositories/filters/SalaFilterBuild.js', () =>
  jest.fn().mockImplementation(() => ({
    comNome: mockComNome,
    comCampus: mockComCampus,
    comBloco: mockComBloco,
    build: mockBuild
  }))
);

import SalaFilterBuilder from '@repositories/filters/SalaFilterBuild.js';

describe('SalaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    test('deve retornar paginação com filtros e opções', async () => {
      const mockReq = {
        params: {},
        query: {
          nome: 'Sala',
          campus: 'campusId',
          bloco: 'Bloco A',
          page: '2',
          limite: '5'
        }
      };

      Sala.paginate.mockResolvedValue({
        docs: [],
        totalDocs: 0,
        page: 2,
        limit: 5
      });

      const repository = new SalaRepository();
      const result = await repository.listar(mockReq);

      expect(SalaFilterBuilder).toHaveBeenCalledTimes(1);
      expect(mockComNome).toHaveBeenCalledWith('Sala');
      expect(mockComCampus).toHaveBeenCalledWith('campusId');
      expect(mockComBloco).toHaveBeenCalledWith('Bloco A');
      expect(mockBuild).toHaveBeenCalled();
      expect(Sala.paginate).toHaveBeenCalled();
      expect(result).toEqual({
        docs: [],
        totalDocs: 0,
        page: 2,
        limit: 5
      });
    });
  });
});