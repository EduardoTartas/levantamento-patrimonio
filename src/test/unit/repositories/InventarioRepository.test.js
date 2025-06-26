import InventarioRepository from "@repositories/InventarioRepository";
import { CustomError, messages } from "@utils/helpers";
import InventarioFilterBuilder from "@repositories/filters/InventarioFilterBuild";

// Mock das dependências
jest.mock("@utils/helpers", () => ({
  CustomError: jest.fn().mockImplementation(({ statusCode, errorType, field, customMessage }) => {
    const err = new Error(customMessage);
    err.statusCode = statusCode;
    err.errorType = errorType;
    err.field = field;
    return err;
  }),
  messages: {
    error: {
      resourceNotFound: jest.fn(resource => `${resource} não encontrado.`),
      internalServerError: jest.fn(resource => `Erro interno no servidor ao processar ${resource}.`),
    },
  },
}));

jest.mock("@repositories/filters/InventarioFilterBuild");

// Mock para a instância do modelo retornada pelo construtor em 'criar'
const mockInventarioInstance = {
  save: jest.fn(),
};

describe("InventarioRepository", () => {
  let repository;
  let MockInventarioModelConstructor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Configuração para o construtor do modelo usado em 'criar' e como base para outros métodos
    MockInventarioModelConstructor = jest.fn(() => mockInventarioInstance);
    MockInventarioModelConstructor.paginate = jest.fn(); // Adiciona paginate ao construtor mockado

    // Mock para InventarioFilterBuilder (configuração padrão para cada teste)
    // Esta implementação será usada a menos que mockImplementationOnce a sobrescreva
    InventarioFilterBuilder.mockImplementation(() => ({
      comNome: jest.fn().mockReturnThis(),
      comAtivo: jest.fn().mockReturnThis(),
      comData: jest.fn().mockReturnThis(),
      comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    }));
    
    // Cria uma nova instância do repositório para cada teste
    repository = new InventarioRepository({ Inventario: MockInventarioModelConstructor });
  });

  // Helper para criar a instância do repositório com mocks (não mais necessário se repository é criado no beforeEach)
  // const createRepository = (Model = MockInventarioModelConstructor) => {
  //   return new InventarioRepository({ Inventario: Model });
  // };

  // --- Testes Construtor ---
  describe("Construtor", () => {
    it("Deve instanciar o repositório com um modelo Inventario que possua o método paginate", () => {
      const mockModelWithPaginate = { paginate: jest.fn() };
      const repo = new InventarioRepository({ Inventario: mockModelWithPaginate }); // Usa diretamente
      expect(repo).toBeInstanceOf(InventarioRepository);
      expect(repo.model).toBe(mockModelWithPaginate);
      expect(mockModelWithPaginate.paginate).toBeDefined();
    });

    it("Deve lançar um erro se o modelo Inventario injetado não possuir o método paginate", () => {
      const mockModelWithoutPaginate = {}; // Sem método paginate
      expect(() => new InventarioRepository({ Inventario: mockModelWithoutPaginate })).toThrow(
        "The inventario model must include the paginate method. Ensure mongoose-paginate-v2 is applied."
      );
    });
  });

  // --- Testes buscarPorId ---
  describe("buscarPorId", () => {
    // repository já é instanciado no beforeEach do describe("InventarioRepository")

    it("Deve buscar um inventário pelo ID (encontrado, includeTokens=false)", async () => {
      const mockInventarioId = "some-id";
      const mockInventarioData = { _id: mockInventarioId, nome: "Inventario Teste" };
      
      const mockQueryInstance = {
        select: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(mockInventarioData).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(mockInventarioData).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      const result = await repository.buscarPorId(mockInventarioId, false);

      expect(MockInventarioModelConstructor.findById).toHaveBeenCalledWith(mockInventarioId);
      expect(mockQueryInstance.select).not.toHaveBeenCalledWith("+refreshtoken +accesstoken");
      expect(result).toEqual(mockInventarioData);
    });
    
    it("Deve buscar um inventário pelo ID (encontrado, includeTokens=true)", async () => {
      const mockInventarioId = "some-id";
      const mockInventarioData = { _id: mockInventarioId, nome: "Inventario Teste", refreshtoken: "rt", accesstoken: "at" };
        
      const mockQueryInstance = {
        select: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(mockInventarioData).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(mockInventarioData).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      const result = await repository.buscarPorId(mockInventarioId, true);

      expect(MockInventarioModelConstructor.findById).toHaveBeenCalledWith(mockInventarioId);
      expect(mockQueryInstance.select).toHaveBeenCalledWith("+refreshtoken +accesstoken");
      expect(result).toEqual(mockInventarioData);
    });

    it("Deve lançar CustomError se nenhum inventário for encontrado com o ID fornecido", async () => {
      const mockInventarioIdInexistente = "non-existent-id";
      const mockQueryInstance = {
        select: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(null).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(null).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      await expect(repository.buscarPorId(mockInventarioIdInexistente)).rejects.toThrow(Error);
      expect(MockInventarioModelConstructor.findById).toHaveBeenCalledWith(mockInventarioIdInexistente);
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });
  });

  // --- Testes listar ---
  describe("listar", () => {
    // repository já é instanciado no beforeEach do describe("InventarioRepository")

    const mockReqWithId = (id) => ({ params: { id }, query: {} });
    const mockReqWithQuery = (query) => ({ params: {}, query });

    it("Deve buscar o inventário por ID com populate e lean se um ID é fornecido (encontrado)", async () => {
      const mockInventarioId = "some-id";
      const mockInventarioDataComCampusPopulado = { _id: mockInventarioId, nome: "Teste", campus: { nome: "Campus X", _id: "campus-id" } };
      
      const mockQueryInstance = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(mockInventarioDataComCampusPopulado).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(mockInventarioDataComCampusPopulado).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      const result = await repository.listar(mockReqWithId(mockInventarioId));

      expect(MockInventarioModelConstructor.findById).toHaveBeenCalledWith(mockInventarioId);
      expect(mockQueryInstance.populate).toHaveBeenCalledWith({ path: "campus", select: "nome _id" });
      expect(mockQueryInstance.lean).toHaveBeenCalled();
      expect(result).toEqual(mockInventarioDataComCampusPopulado);
    });

    it("Deve lançar CustomError se um ID é fornecido e o inventário não é encontrado", async () => {
      const mockInventarioIdInexistente = "non-existent-id";
      const mockQueryInstance = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(null).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(null).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      await expect(repository.listar(mockReqWithId(mockInventarioIdInexistente))).rejects.toThrow(Error);
      expect(MockInventarioModelConstructor.findById).toHaveBeenCalledWith(mockInventarioIdInexistente);
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });

    it("Deve listar com filtros, paginação, populate, sort e lean se nenhum ID é fornecido", async () => {
      const mockQueryReq = { nome: "Test", ativo: "false", data: "2023-01-01", page: "2", campus: "campusId", limite: "20" };
      const mockPaginatedData = { docs: [], totalDocs: 0, limit: 20, page: 2 };
      const mockFiltrosConstruidos = { nome: "Test", ativo: false, data: new Date("2023-01-01"), campus: "campusId" };
    
      // Configura a instância mockada do FilterBuilder que será retornada
      // quando 'new InventarioFilterBuilder()' for chamado dentro de 'repository.listar()'
      const mockFilterBuilderInstance = {
        comNome: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        comData: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(), // Mantém o comportamento async
        build: jest.fn().mockReturnValue(mockFiltrosConstruidos),
      };
      InventarioFilterBuilder.mockImplementationOnce(() => mockFilterBuilderInstance);
    
      // O repositório já foi criado no beforeEach e usará a mockImplementationOnce acima.
      MockInventarioModelConstructor.paginate.mockResolvedValue(mockPaginatedData);
    
      const result = await repository.listar(mockReqWithQuery(mockQueryReq));
    
      // Verifica se o construtor do InventarioFilterBuilder foi chamado
      expect(InventarioFilterBuilder).toHaveBeenCalledTimes(1);
    
      // Verifica as chamadas na instância específica do builder que foi mockada
      expect(mockFilterBuilderInstance.comNome).toHaveBeenCalledWith("Test");
      expect(mockFilterBuilderInstance.comAtivo).toHaveBeenCalledWith("false");
      expect(mockFilterBuilderInstance.comData).toHaveBeenCalledWith("2023-01-01");
      expect(mockFilterBuilderInstance.comCampus).toHaveBeenCalledWith("campusId");
      expect(mockFilterBuilderInstance.build).toHaveBeenCalledTimes(1);
    
      expect(MockInventarioModelConstructor.paginate).toHaveBeenCalledWith(
        mockFiltrosConstruidos,
        {
          page: 2,
          limit: 20,
          populate: { path: "campus", select: "nome _id" },
          sort: { nome: 1 },
          lean: true,
        }
      );
      expect(result).toEqual(mockPaginatedData);
    });

    it("Deve usar valores padrão para filtros e paginação se não fornecidos na query", async () => {
      const mockPaginatedData = { docs: [], totalDocs: 0, limit: 10, page: 1 };
      const mockFiltrosDefault = {}; 
  
      const mockFilterBuilderInstance = {
        comNome: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        comData: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
        build: jest.fn().mockReturnValue(mockFiltrosDefault),
      };
      InventarioFilterBuilder.mockImplementationOnce(() => mockFilterBuilderInstance);
      
      MockInventarioModelConstructor.paginate.mockResolvedValue(mockPaginatedData);
  
      const result = await repository.listar(mockReqWithQuery({}));
  
      expect(InventarioFilterBuilder).toHaveBeenCalledTimes(1);
      expect(mockFilterBuilderInstance.comNome).toHaveBeenCalledWith("");
      expect(mockFilterBuilderInstance.comAtivo).toHaveBeenCalledWith(true); 
      expect(mockFilterBuilderInstance.comData).toHaveBeenCalledWith("");
      expect(mockFilterBuilderInstance.comCampus).toHaveBeenCalledWith("");
      expect(mockFilterBuilderInstance.build).toHaveBeenCalledTimes(1);
  
      expect(MockInventarioModelConstructor.paginate).toHaveBeenCalledWith(
        mockFiltrosDefault,
        expect.objectContaining({
          page: 1,
          limit: 10,
          populate: { path: "campus", select: "nome _id" },
          sort: { nome: 1 },
          lean: true,
        })
      );
      expect(result).toEqual(mockPaginatedData);
    });

    it("Deve restringir o parâmetro limite da paginação a um máximo de 100", async () => {
      MockInventarioModelConstructor.paginate.mockResolvedValue({ docs: [], totalDocs: 0, limit: 100, page: 1 });
      
      // A instância do FilterBuilder será a padrão definida no beforeEach do describe principal,
      // ou uma nova se mockImplementationOnce for usado aqui (o que não é necessário para este teste específico).
      // O importante é que o paginate seja chamado com o limite correto.

      await repository.listar(mockReqWithQuery({ limite: "200" }));

      expect(MockInventarioModelConstructor.paginate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it("Deve lançar CustomError com status 500 se filterBuilder.build não for uma função", async () => {
      InventarioFilterBuilder.mockImplementationOnce(() => ({
        comNome: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        comData: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
        build: undefined, // Força o erro
      }));
      
      // repository já está instanciado e usará a mockImplementationOnce acima
      // quando new InventarioFilterBuilder() for chamado dentro de listar.

      await expect(repository.listar(mockReqWithQuery({}))).rejects.toThrow(Error);
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 500,
        errorType: "internalServerError",
        field: "Inventário",
        details: [],
        customMessage: messages.error.internalServerError("Inventário"),
      });
    });
  });

  // --- Testes criar ---
  describe("criar", () => {
    // repository já é instanciado no beforeEach do describe("InventarioRepository")

    it("Deve instanciar this.model com os dados fornecidos e chamar save()", async () => {
      const novoInventarioData = { nome: "Novo Inventario", quantidade: 10 };
      const inventarioSalvo = { ...novoInventarioData, _id: "new-id" };
      
      mockInventarioInstance.save.mockResolvedValue(inventarioSalvo); // mockInventarioInstance é retornado por MockInventarioModelConstructor

      const result = await repository.criar(novoInventarioData);

      expect(MockInventarioModelConstructor).toHaveBeenCalledWith(novoInventarioData);
      expect(mockInventarioInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(inventarioSalvo);
    });
  });

  // --- Testes atualizar ---
  describe("atualizar", () => {
    // repository já é instanciado no beforeEach do describe("InventarioRepository")

    it("Deve atualizar um inventário por ID, aplicar populate, lean e retornar os dados atualizados (encontrado)", async () => {
      const mockInventarioId = "some-id";
      const dadosAtualizacao = { nome: "Inventario Atualizado" };
      const inventarioAtualizadoComCampus = { _id: mockInventarioId, ...dadosAtualizacao, campus: { nome: "Campus Y", _id: "campus-y-id" } };
      
      const mockQueryInstance = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(inventarioAtualizadoComCampus).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(inventarioAtualizadoComCampus).catch(onRejected),
      };
      MockInventarioModelConstructor.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryInstance);

      const result = await repository.atualizar(mockInventarioId, dadosAtualizacao);

      expect(MockInventarioModelConstructor.findByIdAndUpdate).toHaveBeenCalledWith(
        mockInventarioId,
        dadosAtualizacao,
        { new: true }
      );
      expect(mockQueryInstance.populate).toHaveBeenCalledWith({ path: "campus", select: "nome _id" });
      expect(mockQueryInstance.lean).toHaveBeenCalled();
      expect(result).toEqual(inventarioAtualizadoComCampus);
    });

    it("Deve lançar CustomError se o inventário não for encontrado para atualização", async () => {
      const mockInventarioIdInexistente = "non-existent-id";
      const dadosAtualizacao = { nome: "Inventario Atualizado" };

      const mockQueryInstance = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(null).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(null).catch(onRejected),
      };
      MockInventarioModelConstructor.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryInstance);

      await expect(repository.atualizar(mockInventarioIdInexistente, dadosAtualizacao)).rejects.toThrow(Error);
      expect(MockInventarioModelConstructor.findByIdAndUpdate).toHaveBeenCalledWith(
        mockInventarioIdInexistente,
        dadosAtualizacao,
        { new: true }
      );
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });
  });

  // --- Testes deletar ---
  describe("deletar", () => {
    // repository já é instanciado no beforeEach do describe("InventarioRepository")

    it("Deve deletar um inventário por ID e retornar o documento deletado (existente)", async () => {
      const mockInventarioId = "some-id";
      const mockInventarioDeletadoDocumento = { _id: mockInventarioId, nome: "Deletado" };
      MockInventarioModelConstructor.findByIdAndDelete = jest.fn().mockResolvedValue(mockInventarioDeletadoDocumento);

      const result = await repository.deletar(mockInventarioId);

      expect(MockInventarioModelConstructor.findByIdAndDelete).toHaveBeenCalledWith(mockInventarioId);
      expect(result).toEqual(mockInventarioDeletadoDocumento);
    });

    it("Deve chamar findByIdAndDelete e retornar null se o inventário não existir", async () => {
      const idInexistente = "non-existent-id";
      MockInventarioModelConstructor.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const result = await repository.deletar(idInexistente);

      expect(MockInventarioModelConstructor.findByIdAndDelete).toHaveBeenCalledWith(idInexistente);
      expect(result).toBeNull();
    });
  });
});