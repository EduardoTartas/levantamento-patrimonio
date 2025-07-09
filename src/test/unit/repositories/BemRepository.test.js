import BemRepository from '@repositories/BemRepository.js';

const mockBemFindById = jest.fn();
const mockBemPaginate = jest.fn();
const mockPopulate = jest.fn();
let directQueryResolverValue;

const queryMock = {};
Object.assign(queryMock, {
  populate: mockPopulate,
  then: (onFulfilled, onRejected) => Promise.resolve(directQueryResolverValue).then(onFulfilled, onRejected),
  exec: (callback) => {
    const promise = Promise.resolve(directQueryResolverValue);
    if (callback) {
      return promise.then(value => callback(null, value), error => callback(error, null));
    }
    return promise;
  }
});

mockPopulate.mockReturnValue(queryMock);

const mockFilterBuilderBuild = jest.fn();
const mockFilterBuilderComNome = jest.fn();
const mockFilterBuilderComTombo = jest.fn();
const mockFilterBuilderComResponsavel = jest.fn();
const mockFilterBuilderComSala = jest.fn();
const mockFilterBuilderComAuditado = jest.fn();
const mockBemFilterBuilderInstance = {
  comNome: mockFilterBuilderComNome.mockReturnThis(),
  comTombo: mockFilterBuilderComTombo.mockReturnThis(),
  comResponsavel: mockFilterBuilderComResponsavel.mockReturnThis(),
  comSala: mockFilterBuilderComSala.mockReturnThis(),
  comAuditado: mockFilterBuilderComAuditado.mockReturnThis(),
  build: mockFilterBuilderBuild,
};

const mockCustomErrorTracker = jest.fn();
const mockMessagesErrorResourceNotFound = jest.fn(resource => `${resource} não encontrado.`);
const mockMessagesErrorInternalServerError = jest.fn(resource => `Erro interno no servidor ao processar ${resource}.`);

jest.mock('@models/Bem.js', () => {
  const MockedBemConstructor = jest.fn();
  MockedBemConstructor.findById = jest.fn().mockImplementation(() => queryMock);
  MockedBemConstructor.paginate = jest.fn().mockImplementation((...args) => mockBemPaginate(...args));
  return MockedBemConstructor;
});

jest.mock('@repositories/filters/BemFilterBuild.js', () => {
  return jest.fn().mockImplementation(() => mockBemFilterBuilderInstance);
});

jest.mock('@utils/helpers/index.js', () => ({
  CustomError: jest.fn().mockImplementation(function(args) {
    const instance = new Error(args.customMessage || 'Erro Customizado');
    Object.assign(instance, args);
    instance.name = 'CustomErrorConstructor';
    mockCustomErrorTracker(args);
    return instance;
  }),
  messages: {
    error: {
      resourceNotFound: (...args) => mockMessagesErrorResourceNotFound(...args),
      internalServerError: (...args) => mockMessagesErrorInternalServerError(...args),
    },
  },
}));

describe('BemRepository', () => {
  let repository;
  let MockedBem;
  const mockBemId = '507f1f77bcf86cd799439011';
  const mockBemData = { 
    _id: mockBemId, 
    nome: 'Mesa de Escritório', 
    tombo: 'TOM123',
    responsavel: {
      nome: 'João da Silva',
      cpf: '12345678909'
    },
    sala: {
      _id: '507f1f77bcf86cd799439013',
      nome: 'Sala A101'
    },
    valor: 275.50,
    auditado: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockedBem = require('@models/Bem.js');
    repository = new BemRepository();
    directQueryResolverValue = undefined;
    mockFilterBuilderBuild.mockReturnValue({});
  });

  describe('constructor', () => {
    it('deve instanciar corretamente com um modelo válido', () => {
      const repo = new BemRepository();
      expect(repo).toBeDefined();
      expect(repo.model).toBe(MockedBem);
    });

    it('deve lançar erro se o modelo não tiver o método paginate', () => {
      const originalPaginate = MockedBem.paginate;
      delete MockedBem.paginate;

      expect(() => new BemRepository())
        .toThrow('The Bem model must include the paginate method. Ensure mongoose-paginate-v2 is applied.');
      
      MockedBem.paginate = originalPaginate;
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar bem por ID com sucesso', async () => {
      directQueryResolverValue = mockBemData;
      
      const result = await repository.buscarPorId(mockBemId);
      
      expect(MockedBem.findById).toHaveBeenCalledWith(mockBemId);
      expect(result).toEqual(mockBemData);
    });

    it('deve lançar CustomError se bem não for encontrado', async () => {
      directQueryResolverValue = null;
      
      await expect(repository.buscarPorId(mockBemId)).rejects.toThrow('Bem não encontrado.');
      
      expect(mockCustomErrorTracker).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Bem',
        customMessage: 'Bem não encontrado.',
      }));
    });
  });

  describe('listar', () => {
    describe('buscar por ID específico', () => {
      it('deve buscar bem por ID com populate de sala', async () => {
        const req = { params: { id: mockBemId }, query: {} };
        directQueryResolverValue = mockBemData;

        const result = await repository.listar(req);

        expect(MockedBem.findById).toHaveBeenCalledWith(mockBemId);
        expect(mockPopulate).toHaveBeenCalledWith({
          path: 'sala',
          select: 'nome _id',
        });
        expect(result).toEqual(mockBemData);
      });

      it('deve lançar CustomError se bem não for encontrado por ID', async () => {
        const req = { params: { id: mockBemId }, query: {} };
        directQueryResolverValue = null;

        await expect(repository.listar(req)).rejects.toThrow('Bem não encontrado.');
      });
    });

    describe('listar com paginação e filtros', () => {
      it('deve listar bens com filtros padrão', async () => {
        const req = { params: {}, query: {} };
        const mockPaginateResult = {
          docs: [mockBemData],
          totalDocs: 1,
          limit: 10,
          page: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        };
        mockBemPaginate.mockResolvedValue(mockPaginateResult);

        const result = await repository.listar(req);

        expect(mockFilterBuilderComNome).toHaveBeenCalledWith('');
        expect(mockFilterBuilderComTombo).toHaveBeenCalledWith('');
        expect(mockFilterBuilderComResponsavel).toHaveBeenCalledWith('');
        expect(mockFilterBuilderComSala).toHaveBeenCalledWith('');
        expect(mockFilterBuilderComAuditado).toHaveBeenCalledWith(false);
        expect(mockFilterBuilderBuild).toHaveBeenCalled();
        
        expect(mockBemPaginate).toHaveBeenCalledWith(
          expect.any(Object),
          {
            page: 1,
            populate: {
              path: 'sala',
              select: 'nome _id',
            },
            limit: 10,
            sort: { nome: 1 },
          }
        );
        expect(result).toEqual(mockPaginateResult);
      });

      it('deve listar bens com filtros específicos', async () => {
        const req = { 
          params: {}, 
          query: { 
            nome: 'Mesa',
            tombo: 'TOM123',
            responsavel: 'João',
            auditado: 'true',
            sala: 'A101',
            page: '2',
            limite: '5'
          } 
        };
        const mockPaginateResult = {
          docs: [mockBemData],
          totalDocs: 1,
          limit: 5,
          page: 2,
          totalPages: 1
        };
        mockBemPaginate.mockResolvedValue(mockPaginateResult);

        const result = await repository.listar(req);

        expect(mockFilterBuilderComNome).toHaveBeenCalledWith('Mesa');
        expect(mockFilterBuilderComTombo).toHaveBeenCalledWith('TOM123');
        expect(mockFilterBuilderComResponsavel).toHaveBeenCalledWith('João');
        expect(mockFilterBuilderComSala).toHaveBeenCalledWith('A101');
        expect(mockFilterBuilderComAuditado).toHaveBeenCalledWith('true');
        
        expect(mockBemPaginate).toHaveBeenCalledWith(
          expect.any(Object),
          {
            page: 2,
            populate: {
              path: 'sala',
              select: 'nome _id',
            },
            limit: 5,
            sort: { nome: 1 },
          }
        );
        expect(result).toEqual(mockPaginateResult);
      });

      it('deve aplicar limite máximo de 100', async () => {
        const req = { 
          params: {}, 
          query: { limite: '150' }
        };
        const mockPaginateResult = { docs: [], totalDocs: 0 };
        mockBemPaginate.mockResolvedValue(mockPaginateResult);

        await repository.listar(req);

        expect(mockBemPaginate).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            limit: 100,
          })
        );
      });

      it('deve usar valores padrão para paginação', async () => {
        const req = { params: {}, query: {} };
        const mockPaginateResult = { docs: [], totalDocs: 0 };
        mockBemPaginate.mockResolvedValue(mockPaginateResult);

        await repository.listar(req);

        expect(mockBemPaginate).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            page: 1,
            limit: 10,
          })
        );
      });
    });
  });
});
