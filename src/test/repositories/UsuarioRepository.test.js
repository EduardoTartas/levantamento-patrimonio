import UsuarioRepository from '@repositories/UsuarioRepository.js';

// --- Definição dos Mocks e Trackers ---

// Para UsuarioModel e suas queries
const mockUsuarioSave = jest.fn();
const mockUsuarioFindOne = jest.fn();
const mockUsuarioPaginate = jest.fn();
const mockUsuarioFindByIdAndDelete = jest.fn();

// Mocks para os métodos de query chainable
const mockSelect = jest.fn();
const mockPopulate = jest.fn();
const mockLean = jest.fn();
let directQueryResolverValue; 

// queryMock: Este objeto simula a query do Mongoose.
const queryMock = {}; 

Object.assign(queryMock, {
  select: mockSelect,
  populate: mockPopulate,
  lean: mockLean,
  then: (onFulfilled, onRejected) => Promise.resolve(directQueryResolverValue).then(onFulfilled, onRejected),
  exec: (callback) => {
    const promise = Promise.resolve(directQueryResolverValue);
    if (callback) {
      return promise.then(value => callback(null, value), error => callback(error, null));
    }
    return promise;
  }
});

mockSelect.mockReturnValue(queryMock);
mockPopulate.mockReturnValue(queryMock);
mockLean.mockReturnValue(queryMock);

// Para UsuarioFilterBuilder
const mockFilterBuilderBuild = jest.fn();
const mockFilterBuilderComNome = jest.fn();
const mockFilterBuilderComAtivo = jest.fn();
const mockFilterBuilderComCampus = jest.fn();
const mockUsuarioFilterBuilderInstance = {
  comNome: mockFilterBuilderComNome.mockReturnThis(),
  comAtivo: mockFilterBuilderComAtivo.mockReturnThis(),
  comCampus: mockFilterBuilderComCampus.mockReturnThis(),
  build: mockFilterBuilderBuild,
};

// Para utils/helpers
const mockCustomErrorTracker = jest.fn();
const mockMessagesErrorResourceNotFound = jest.fn(resource => `${resource} não encontrado.`);
const mockMessagesErrorInternalServerError = jest.fn(resource => `Erro interno no servidor ao processar ${resource}.`);

// --- Mocks das Dependências ---

jest.mock('@models/Usuario.js', () => {
  const MockedUsuarioConstructor = jest.fn().mockImplementation(data => ({
    ...data,
    save: (...args) => mockUsuarioSave(...args), 
  }));

  MockedUsuarioConstructor.findById = jest.fn().mockImplementation(() => queryMock);
  MockedUsuarioConstructor.findOne = jest.fn().mockImplementation((...args) => mockUsuarioFindOne(...args));
  MockedUsuarioConstructor.paginate = jest.fn().mockImplementation((...args) => mockUsuarioPaginate(...args));
  MockedUsuarioConstructor.findByIdAndUpdate = jest.fn().mockImplementation(() => queryMock);
  MockedUsuarioConstructor.findByIdAndDelete = jest.fn().mockImplementation((...args) => mockUsuarioFindByIdAndDelete(...args));
  
  return MockedUsuarioConstructor;
});

jest.mock('@models/Campus.js', () => jest.fn());

jest.mock('@repositories/filters/UsuarioFilterBuilder.js', () => {
  return jest.fn().mockImplementation(() => mockUsuarioFilterBuilderInstance);
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

// --- Início dos Testes ---
describe('UsuarioRepository', () => {
  let repository;
  const mockUsuarioId = 'mockUserId123';
  const mockUsuarioData = { _id: mockUsuarioId, nome: 'Usuário Teste', email: 'teste@exemplo.com', campus: 'campusId' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    require('@repositories/filters/UsuarioFilterBuilder.js').mockImplementation(() => mockUsuarioFilterBuilderInstance);

    const MockedUsuario = require('@models/Usuario.js');
    const MockedCampus = require('@models/Campus.js');
    repository = new UsuarioRepository({ Usuario: MockedUsuario, Campus: MockedCampus });

    directQueryResolverValue = undefined; 
  });

  describe('constructor', () => {
    it('deve instanciar corretamente com um modelo válido', () => {
      const MockedUsuario = require('@models/Usuario.js');
      const repo = new UsuarioRepository({ Usuario: MockedUsuario });
      expect(repo).toBeDefined();
      expect(repo.model).toBe(MockedUsuario);
      expect(typeof repo.model.paginate).toBe('function');
    });

    it('deve lançar erro se o modelo não tiver o método paginate', () => {
      const InvalidModelNoPaginate = jest.fn();
      expect(() => new UsuarioRepository({ Usuario: InvalidModelNoPaginate }))
        .toThrow('The Usuario model must include the paginate method. Ensure mongoose-paginate-v2 is applied.');
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar usuário por ID sem tokens', async () => {
      directQueryResolverValue = mockUsuarioData;
      const result = await repository.buscarPorId(mockUsuarioId);
      expect(require('@models/Usuario.js').findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(mockSelect).not.toHaveBeenCalled(); 
      expect(result).toEqual(mockUsuarioData);
    });

    it('deve buscar usuário por ID incluindo tokens', async () => {
      const userWithTokens = { ...mockUsuarioData, refreshtoken: 'rt', accesstoken: 'at' };
      directQueryResolverValue = userWithTokens;
      const result = await repository.buscarPorId(mockUsuarioId, true);
      expect(require('@models/Usuario.js').findById).toHaveBeenCalledWith(mockUsuarioId);
      expect(mockSelect).toHaveBeenCalledWith('+refreshtoken +accesstoken');
      expect(result).toEqual(userWithTokens);
    });

    it('deve lançar CustomError se usuário não for encontrado em buscarPorId', async () => {
      directQueryResolverValue = null;
      await expect(repository.buscarPorId(mockUsuarioId)).rejects.toThrow('Usuário não encontrado.');
      expect(mockCustomErrorTracker).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        customMessage: mockMessagesErrorResourceNotFound("Usuário"),
      }));
    });
  });

  describe('buscarPorEmail', () => {
    it('deve buscar usuário por email', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(mockUsuarioData); 
      const email = 'teste@exemplo.com';
      const result = await repository.buscarPorEmail(email);
      expect(require('@models/Usuario.js').findOne).toHaveBeenCalledWith({ email }, '+senha');
      expect(result).toEqual(mockUsuarioData);
    });

    it('deve buscar usuário por email ignorando um ID', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(mockUsuarioData);
      const email = 'teste@exemplo.com';
      const idIgnorado = 'outroId';
      await repository.buscarPorEmail(email, idIgnorado);
      expect(require('@models/Usuario.js').findOne).toHaveBeenCalledWith({ email, _id: { $ne: idIgnorado } }, '+senha');
    });

    it('deve retornar null se nenhum usuário for encontrado por email', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(null);
      const email = 'inexistente@exemplo.com';
      const result = await repository.buscarPorEmail(email);
      expect(result).toBeNull();
    });
  });

  describe('buscarPorCpf', () => {
    it('deve buscar usuário por CPF', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(mockUsuarioData);
      const cpf = '12345678900';
      const result = await repository.buscarPorCpf(cpf);
      expect(require('@models/Usuario.js').findOne).toHaveBeenCalledWith({ cpf });
      expect(result).toEqual(mockUsuarioData);
    });

    it('deve buscar usuário por CPF ignorando um ID', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(mockUsuarioData);
      const cpf = '12345678900';
      const idIgnorado = 'outroId';
      await repository.buscarPorCpf(cpf, idIgnorado);
      expect(require('@models/Usuario.js').findOne).toHaveBeenCalledWith({ cpf, _id: { $ne: idIgnorado } });
    });

    it('deve retornar null se nenhum usuário for encontrado por CPF', async () => {
      mockUsuarioFindOne.mockResolvedValueOnce(null);
      const cpf = '00000000000';
      const result = await repository.buscarPorCpf(cpf);
      expect(result).toBeNull();
    });
  });

  describe('listar', () => {
    const mockReqWithId = { params: { id: mockUsuarioId }, query: {} };

    describe('Quando um ID é fornecido nos parâmetros', () => {
      it('deve buscar e retornar um único usuário por ID com populate e lean', async () => {
        directQueryResolverValue = mockUsuarioData; 
        const result = await repository.listar(mockReqWithId);
        expect(require('@models/Usuario.js').findById).toHaveBeenCalledWith(mockUsuarioId);
        expect(mockPopulate).toHaveBeenCalledWith({ path: 'campus', select: 'nome _id' });
        expect(mockLean).toHaveBeenCalled(); 
        expect(result).toEqual(mockUsuarioData);
      });

      it('deve lançar CustomError se usuário não for encontrado ao listar por ID', async () => {
        directQueryResolverValue = null; 
        await expect(repository.listar(mockReqWithId)).rejects.toThrow('Usuário não encontrado.');
        expect(mockCustomErrorTracker).toHaveBeenCalledWith(expect.objectContaining({
          statusCode: 404,
          customMessage: mockMessagesErrorResourceNotFound("Usuário"),
        }));
      });
    });

    describe('Quando nenhum ID é fornecido (listagem com filtros e paginação)', () => {
      const mockReqQueryBase = { params: {} };
      const mockFiltrosConstruidos = { nome: /Teste/i, status: true, campus: { $in: ['campusIdCentral'] } };
      const mockPaginatedData = { docs: [mockUsuarioData], totalDocs: 1, limit: 20, page: 2, totalPages: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null };

      it('deve construir filtros e paginar resultados', async () => {
        const mockReqQuery = { 
          ...mockReqQueryBase, 
          query: { nome: 'Teste', ativo: 'true', campus: 'Campus Central', page: '2', limite: '20' }
        };
        mockFilterBuilderBuild.mockReturnValue(mockFiltrosConstruidos);
        mockUsuarioPaginate.mockResolvedValue(mockPaginatedData); 

        const result = await repository.listar(mockReqQuery);

        expect(require('@repositories/filters/UsuarioFilterBuilder.js')).toHaveBeenCalledTimes(1);
        expect(mockFilterBuilderComNome).toHaveBeenCalledWith('Teste');
        expect(mockFilterBuilderComAtivo).toHaveBeenCalledWith('true');
        expect(mockFilterBuilderComCampus).toHaveBeenCalledWith('Campus Central');
        expect(mockFilterBuilderBuild).toHaveBeenCalledTimes(1);
        expect(require('@models/Usuario.js').paginate).toHaveBeenCalledWith(mockFiltrosConstruidos, {
          page: 2,
          limit: 20,
          populate: { path: 'campus', select: 'nome _id' },
          sort: { nome: 1 },
          lean: true,
        });
        expect(result).toEqual(mockPaginatedData);
      });

      it('deve usar valores padrão para filtros e paginação se não fornecidos', async () => {
        const emptyReqQuery = { ...mockReqQueryBase, query: {} };
        mockFilterBuilderBuild.mockReturnValueOnce({ status: true }); 
        mockUsuarioPaginate.mockResolvedValueOnce(mockPaginatedData);
        
        await repository.listar(emptyReqQuery);

        expect(mockFilterBuilderComNome).toHaveBeenCalledWith('');
        expect(mockFilterBuilderComAtivo).toHaveBeenCalledWith(true); 
        expect(mockFilterBuilderComCampus).toHaveBeenCalledWith('');
        expect(require('@models/Usuario.js').paginate).toHaveBeenCalledWith(expect.objectContaining({status: true}), expect.objectContaining({
          page: 1,
          limit: 10,
        }));
      });
      
      it('deve limitar o "limite" a 100 no máximo', async () => {
        const reqWithHighLimit = { ...mockReqQueryBase, query: { limite: '200' } };
        mockFilterBuilderBuild.mockReturnValueOnce({});
        mockUsuarioPaginate.mockResolvedValueOnce(mockPaginatedData);

        await repository.listar(reqWithHighLimit);
        expect(require('@models/Usuario.js').paginate).toHaveBeenCalledWith({}, expect.objectContaining({
          limit: 100,
        }));
      });

      it('deve lançar CustomError se filterBuilder.build não for uma função (cenário de guarda)', async () => {
        const originalFilterBuilderMock = require('@repositories/filters/UsuarioFilterBuilder.js').getMockImplementation();
        require('@repositories/filters/UsuarioFilterBuilder.js').mockImplementationOnce(() => ({
          comNome: jest.fn().mockReturnThis(),
          comAtivo: jest.fn().mockReturnThis(),
          comCampus: jest.fn().mockReturnThis(),
          build: undefined, 
        }));
        
        const MockedUsuario = require('@models/Usuario.js');
        const MockedCampus = require('@models/Campus.js');
        const tempRepository = new UsuarioRepository({ Usuario: MockedUsuario, Campus: MockedCampus });


        const mockReqQuery = { ...mockReqQueryBase, query: { nome: 'Teste' } };
        await expect(tempRepository.listar(mockReqQuery)).rejects.toThrow('Erro interno no servidor ao processar Usuário.');
        expect(mockCustomErrorTracker).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            errorType: "internalServerError",
            customMessage: mockMessagesErrorInternalServerError("Usuário"),
        }));
        // Restore original mock for other tests
        if (originalFilterBuilderMock) {
            require('@repositories/filters/UsuarioFilterBuilder.js').mockImplementation(originalFilterBuilderMock);
        }
      });
    });
  });

  describe('criar', () => {
    it('deve criar e salvar um novo usuário', async () => {
      const novoUsuario = { nome: 'Novo Usuário', email: 'novo@exemplo.com' };
      const usuarioSalvo = { _id: 'novoIdUnico', ...novoUsuario };
      
      mockUsuarioSave.mockResolvedValueOnce(usuarioSalvo);

      const result = await repository.criar(novoUsuario);

      expect(require('@models/Usuario.js')).toHaveBeenCalledWith(novoUsuario);
      expect(mockUsuarioSave).toHaveBeenCalledTimes(1);
      expect(result).toEqual(usuarioSalvo);
    });
  });

  describe('atualizar', () => {
    const dadosAtualizacao = { nome: 'Usuário Atualizado' };
    const usuarioAtualizado = { ...mockUsuarioData, ...dadosAtualizacao };

    it('deve atualizar um usuário e retornar os dados atualizados com populate e lean', async () => {
      directQueryResolverValue = usuarioAtualizado; 
      const result = await repository.atualizar(mockUsuarioId, dadosAtualizacao);
      expect(require('@models/Usuario.js').findByIdAndUpdate).toHaveBeenCalledWith(mockUsuarioId, dadosAtualizacao, { new: true });
      expect(mockPopulate).toHaveBeenCalledWith({ path: 'campus', select: 'nome _id' });
      expect(mockLean).toHaveBeenCalled();
      expect(result).toEqual(usuarioAtualizado);
    });

    it('deve lançar CustomError se usuário não for encontrado para atualização', async () => {
      directQueryResolverValue = null; 
      await expect(repository.atualizar(mockUsuarioId, dadosAtualizacao)).rejects.toThrow('Usuário não encontrado.');
      expect(mockCustomErrorTracker).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        customMessage: mockMessagesErrorResourceNotFound("Usuário"),
      }));
    });
  });

  describe('deletar', () => {
    it('deve deletar um usuário por ID', async () => {
      const mockDeleteResult = { acknowledged: true, deletedCount: 1 };
      mockUsuarioFindByIdAndDelete.mockResolvedValueOnce(mockDeleteResult); 
      const result = await repository.deletar(mockUsuarioId);
      expect(require('@models/Usuario.js').findByIdAndDelete).toHaveBeenCalledWith(mockUsuarioId);
      expect(result).toEqual(mockDeleteResult);
    });

    it('deve retornar o resultado mesmo que o usuário não exista (comportamento do findByIdAndDelete)', async () => {
      mockUsuarioFindByIdAndDelete.mockResolvedValueOnce(null); 
      const result = await repository.deletar('idInexistente');
      expect(require('@models/Usuario.js').findByIdAndDelete).toHaveBeenCalledWith('idInexistente');
      expect(result).toBeNull();
    });
  });
});