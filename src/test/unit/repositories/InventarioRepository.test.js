import InventarioRepository from "@repositories/InventarioRepository";
import { CustomError, messages } from "@utils/helpers";
import InventarioFilterBuilder from "@repositories/filters/InventarioFilterBuild";

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

const mockInventarioInstance = {
  save: jest.fn(),
};

describe("InventarioRepository", () => {
  let repository;
  let MockInventarioModelConstructor;

  beforeEach(() => {
    jest.clearAllMocks();

    MockInventarioModelConstructor = jest.fn(() => mockInventarioInstance);
    MockInventarioModelConstructor.paginate = jest.fn();

    InventarioFilterBuilder.mockImplementation(() => ({
      comNome: jest.fn().mockReturnThis(),
      comAtivo: jest.fn().mockReturnThis(),
      comData: jest.fn().mockReturnThis(),
      comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    }));
    
    repository = new InventarioRepository({ Inventario: MockInventarioModelConstructor });
  });

  describe("Construtor", () => {
    it("Deve instanciar o repositório com um modelo Inventario que possua o método paginate", () => {
      const mockModelWithPaginate = { paginate: jest.fn() };
      const repo = new InventarioRepository({ Inventario: mockModelWithPaginate });
      expect(repo).toBeInstanceOf(InventarioRepository);
      expect(repo.model).toBe(mockModelWithPaginate);
    });

    it("Deve lançar um erro se o modelo Inventario não possuir o método paginate", () => {
      const mockModelWithoutPaginate = {};
      expect(() => new InventarioRepository({ Inventario: mockModelWithoutPaginate })).toThrow(
        "The inventario model must include the paginate method. Ensure mongoose-paginate-v2 is applied."
      );
    });
  });

  describe("buscarPorId", () => {
    it("Deve buscar um inventário pelo ID (encontrado)", async () => {
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
      expect(result).toEqual(mockInventarioData);
    });

    it("Deve buscar um inventário pelo ID (includeTokens=true)", async () => {
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

    it("Deve lançar CustomError se inventário não for encontrado", async () => {
      const mockInventarioIdInexistente = "non-existent-id";
      const mockQueryInstance = {
        select: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(null).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(null).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      await expect(repository.buscarPorId(mockInventarioIdInexistente)).rejects.toThrow(Error);
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });
  });

  describe("listar", () => {
    const mockReqWithId = (id) => ({ params: { id }, query: {} });
    const mockReqWithQuery = (query) => ({ params: {}, query });

    it("Deve buscar o inventário por ID com populate e lean se um ID é fornecido", async () => {
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

    it("Deve lançar CustomError se ID é fornecido e inventário não é encontrado", async () => {
      const mockInventarioIdInexistente = "non-existent-id";
      const mockQueryInstance = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: (onFulfilled) => Promise.resolve(null).then(onFulfilled),
        catch: (onRejected) => Promise.resolve(null).catch(onRejected),
      };
      MockInventarioModelConstructor.findById = jest.fn().mockReturnValue(mockQueryInstance);

      await expect(repository.listar(mockReqWithId(mockInventarioIdInexistente))).rejects.toThrow(Error);
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });

    it("Deve listar com filtros, paginação, populate, sort e lean", async () => {
      const mockQueryReq = { nome: "Test", ativo: "false", data: "2023-01-01", page: "2", campus: "campusId", limite: "20" };
      const mockPaginatedData = { docs: [], totalDocs: 0, limit: 20, page: 2 };
      const mockFiltrosConstruidos = { nome: "Test", ativo: false, data: new Date("2023-01-01"), campus: "campusId" };
    
      const mockFilterBuilderInstance = {
        comNome: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        comData: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
        build: jest.fn().mockReturnValue(mockFiltrosConstruidos),
      };
      InventarioFilterBuilder.mockImplementationOnce(() => mockFilterBuilderInstance);
    
      MockInventarioModelConstructor.paginate.mockResolvedValue(mockPaginatedData);
    
      const result = await repository.listar(mockReqWithQuery(mockQueryReq));
    
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

    it("Deve usar valores padrão para filtros e paginação", async () => {
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

      await repository.listar(mockReqWithQuery({ limite: "200" }));

      expect(MockInventarioModelConstructor.paginate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it("Deve lançar CustomError se filterBuilder.build não for uma função", async () => {
      InventarioFilterBuilder.mockImplementationOnce(() => ({
        comNome: jest.fn().mockReturnThis(),
        comAtivo: jest.fn().mockReturnThis(),
        comData: jest.fn().mockReturnThis(),
        comCampus: jest.fn().mockResolvedValue(undefined).mockReturnThis(),
        build: undefined,
      }));

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

  describe("criar", () => {
    it("Deve instanciar this.model com os dados fornecidos e chamar save()", async () => {
      const novoInventarioData = { nome: "Novo Inventario", quantidade: 10 };
      const inventarioSalvo = { ...novoInventarioData, _id: "new-id" };
      
      mockInventarioInstance.save.mockResolvedValue(inventarioSalvo);

      const result = await repository.criar(novoInventarioData);

      expect(MockInventarioModelConstructor).toHaveBeenCalledWith(novoInventarioData);
      expect(mockInventarioInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(inventarioSalvo);
    });
  });

  describe("atualizar", () => {
    it("Deve atualizar um inventário por ID e retornar os dados atualizados", async () => {
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

    it("Deve lançar CustomError se inventário não for encontrado para atualização", async () => {
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
      expect(CustomError).toHaveBeenCalledWith({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    });
  });

  describe("deletar", () => {
    it("Deve deletar um inventário por ID e retornar o documento deletado", async () => {
      const mockInventarioId = "some-id";
      const mockInventarioDeletadoDocumento = { _id: mockInventarioId, nome: "Deletado" };
      MockInventarioModelConstructor.findByIdAndDelete = jest.fn().mockResolvedValue(mockInventarioDeletadoDocumento);

      const result = await repository.deletar(mockInventarioId);

      expect(MockInventarioModelConstructor.findByIdAndDelete).toHaveBeenCalledWith(mockInventarioId);
      expect(result).toEqual(mockInventarioDeletadoDocumento);
    });

    it("Deve retornar null se o inventário não existir", async () => {
      const idInexistente = "non-existent-id";
      MockInventarioModelConstructor.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const result = await repository.deletar(idInexistente);

      expect(MockInventarioModelConstructor.findByIdAndDelete).toHaveBeenCalledWith(idInexistente);
      expect(result).toBeNull();
    });
  });
});