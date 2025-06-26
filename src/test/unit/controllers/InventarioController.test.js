jest.mock("@services/InventarioService.js");
jest.mock("@utils/validators/schemas/zod/querys/InventarioQuerySchema.js", () => ({
    InventarioIdSchema: { parse: jest.fn() },
    InventarioQuerySchema: { parseAsync: jest.fn() },
}));
jest.mock("@utils/validators/schemas/zod/InventarioSchema.js", () => ({
    InventarioSchema: { parse: jest.fn() },
    InventarioUpdateSchema: { parse: jest.fn() },
}));
jest.mock("@utils/helpers/index.js", () => ({
    CommonResponse: {
        success: jest.fn(),
        created: jest.fn(),
    },
    CustomError: class CustomError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            this.name = "CustomError";
        }
    },
    HttpStatusCodes: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
}));

import InventarioController from "@controllers/InventarioController";
import InventarioService from "@services/InventarioService.js";
import { InventarioIdSchema, InventarioQuerySchema } from "@utils/validators/schemas/zod/querys/InventarioQuerySchema.js";
import { InventarioSchema, InventarioUpdateSchema } from "@utils/validators/schemas/zod/InventarioSchema.js";
import { CommonResponse } from "@utils/helpers/index.js";

const mockReq = (params, query, body) => {
    const req = {};
    if (params !== undefined) req.params = params;
    if (query !== undefined) req.query = query;
    if (body !== undefined) req.body = body;
    return req;
};

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("InventarioController", () => {
    let controller;
    let req;
    let res;

    beforeEach(() => {
        controller = new InventarioController();
        res = mockRes();
        jest.clearAllMocks();
    });

    describe("Listar Inventários", () => {
        it("deve listar todos os inventários quando nenhum ID ou query é fornecido", async () => {
            req = mockReq({}, {});
            const mockInventarios = [{ id: "1", nome: "Inventario1" }];
            InventarioService.prototype.listar.mockResolvedValue(mockInventarios);

            await controller.listar(req, res);

            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventarios);
        });

        it("deve listar um inventário por ID quando um ID válido é fornecido", async () => {
            const idValido = "valid-id-123";
            req = mockReq({ id: idValido }, {});
            const mockInventario = { id: idValido, nome: "InventarioEspecifico" };

            InventarioIdSchema.parse.mockReturnValue({ id: idValido });
            InventarioService.prototype.listar.mockResolvedValue(mockInventario);

            await controller.listar(req, res);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValido);
            expect(InventarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventario);
        });

        it("deve listar inventários com query quando uma query válida é fornecida", async () => {
            const queryValida = { status: "disponivel" };
            req = mockReq({}, queryValida);
            const mockInventariosFiltrados = [
                { id: "3", nome: "InventarioFiltrado", status: "disponivel" },
            ];

            InventarioQuerySchema.parseAsync.mockResolvedValue(queryValida);
            InventarioService.prototype.listar.mockResolvedValue(mockInventariosFiltrados);

            await controller.listar(req, res);

            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioQuerySchema.parseAsync).toHaveBeenCalledWith(queryValida);
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventariosFiltrados);
        });

        it("deve propagar erro se a validação do ID (Listar) falhar", async () => {
            const idInvalido = "invalid-id";
            req = mockReq({ id: idInvalido }, {});
            const validationError = new Error("Erro de validação Zod para ID");
            InventarioIdSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.listar(req, res)).rejects.toThrow(validationError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idInvalido);
            expect(InventarioService.prototype.listar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se a validação da query (Listar) falhar", async () => {
            const queryInvalida = { dataCriacao: "not-a-date" };
            req = mockReq({}, queryInvalida);
            const validationError = new Error("Erro de validação Zod para Query");
            InventarioQuerySchema.parseAsync.mockImplementation(async () => {
                throw validationError;
            });

            await expect(controller.listar(req, res)).rejects.toThrow(validationError);

            expect(InventarioQuerySchema.parseAsync).toHaveBeenCalledWith(queryInvalida);
            expect(InventarioService.prototype.listar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se o serviço listar lançar um erro", async () => {
            req = mockReq({}, {});
            const serviceError = new Error("Erro no serviço de listagem");
            InventarioService.prototype.listar.mockRejectedValue(serviceError);

            await expect(controller.listar(req, res)).rejects.toThrow(serviceError);

            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(req);
        });

        it("deve lidar corretamente quando req.params ou req.query são undefined", async () => {
            const mockInventarios = [{ id: "any", nome: "AnyInv" }];
            InventarioService.prototype.listar.mockResolvedValue(mockInventarios);

            let specificReq = mockReq(undefined, {});
            await controller.listar(specificReq, res);
            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(specificReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventarios);

            jest.clearAllMocks();
            InventarioService.prototype.listar.mockResolvedValue(mockInventarios);

            specificReq = mockReq({}, undefined);
            await controller.listar(specificReq, res);
            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(specificReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventarios);

            jest.clearAllMocks();
            InventarioService.prototype.listar.mockResolvedValue(mockInventarios);

            specificReq = mockReq(undefined, undefined);
            await controller.listar(specificReq, res);
            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(InventarioService.prototype.listar).toHaveBeenCalledWith(specificReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockInventarios);
        });
    });

    describe("Criar Inventário", () => {
        it("deve criar um inventário com sucesso com dados válidos", async () => {
            const dadosCorpoValidos = { nome: "Novo Inventario", quantidade: 100 };
            req = mockReq({}, {}, dadosCorpoValidos);
            const dadosParseados = { ...dadosCorpoValidos, _id: "parsed-id" };
            const inventarioCriadoMock = {
                ...dadosParseados,
                toObject: jest.fn().mockReturnValue({ id: "parsed-id", ...dadosCorpoValidos }),
            };

            InventarioSchema.parse.mockReturnValue(dadosParseados);
            InventarioService.prototype.criar.mockResolvedValue(inventarioCriadoMock);

            await controller.criar(req, res);

            expect(InventarioSchema.parse).toHaveBeenCalledWith(dadosCorpoValidos);
            expect(InventarioService.prototype.criar).toHaveBeenCalledWith(dadosParseados);
            expect(inventarioCriadoMock.toObject).toHaveBeenCalled();
            expect(CommonResponse.created).toHaveBeenCalledWith(res, {
                id: "parsed-id",
                ...dadosCorpoValidos,
            });
        });

        it("deve propagar erro se a validação dos dados (Criar) falhar", async () => {
            const dadosCorpoInvalidos = { nome: null };
            req = mockReq({}, {}, dadosCorpoInvalidos);
            const validationError = new Error("Erro de validação Zod para Criação");
            InventarioSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.criar(req, res)).rejects.toThrow(validationError);

            expect(InventarioSchema.parse).toHaveBeenCalledWith(dadosCorpoInvalidos);
            expect(InventarioService.prototype.criar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se o serviço criar lançar um erro", async () => {
            const dadosCorpoValidos = { nome: "Inventario Valido", quantidade: 50 };
            req = mockReq({}, {}, dadosCorpoValidos);
            const dadosParseados = { ...dadosCorpoValidos };
            InventarioSchema.parse.mockReturnValue(dadosParseados);

            const serviceError = new Error("Erro no serviço de criação");
            InventarioService.prototype.criar.mockRejectedValue(serviceError);

            await expect(controller.criar(req, res)).rejects.toThrow(serviceError);

            expect(InventarioSchema.parse).toHaveBeenCalledWith(dadosCorpoValidos);
            expect(InventarioService.prototype.criar).toHaveBeenCalledWith(dadosParseados);
        });
    });

    describe("Atualizar Inventário", () => {
        const idValidoParaAtualizar = "update-id-456";
        const dadosCorpoParaAtualizar = { nome: "Inventario Atualizado", quantidade: 150 };

        it("deve atualizar um inventário com sucesso com ID e dados válidos", async () => {
            req = mockReq({ id: idValidoParaAtualizar }, {}, dadosCorpoParaAtualizar);
            const dadosIdParseados = { id: idValidoParaAtualizar };
            const dadosUpdateParseados = { ...dadosCorpoParaAtualizar };
            const inventarioAtualizadoMock = {
                _id: idValidoParaAtualizar,
                ...dadosUpdateParseados,
            };

            InventarioIdSchema.parse.mockReturnValue(dadosIdParseados);
            InventarioUpdateSchema.parse.mockReturnValue(dadosUpdateParseados);
            InventarioService.prototype.atualizar.mockResolvedValue(inventarioAtualizadoMock);

            await controller.atualizar(req, res);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValidoParaAtualizar);
            expect(InventarioUpdateSchema.parse).toHaveBeenCalledWith(dadosCorpoParaAtualizar);
            expect(InventarioService.prototype.atualizar).toHaveBeenCalledWith(
                idValidoParaAtualizar,
                dadosUpdateParseados
            );
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                inventarioAtualizadoMock,
                200,
                "Inventario atualizado com sucesso."
            );
        });

        it("deve propagar erro se a validação do ID (Atualizar) falhar", async () => {
            const idInvalido = "invalid-update-id";
            req = mockReq({ id: idInvalido }, {}, dadosCorpoParaAtualizar);
            const validationError = new Error("Erro de validação Zod para ID de Atualização");
            InventarioIdSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.atualizar(req, res)).rejects.toThrow(validationError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idInvalido);
            expect(InventarioUpdateSchema.parse).not.toHaveBeenCalled();
            expect(InventarioService.prototype.atualizar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se a validação dos dados do corpo (Atualizar) falhar", async () => {
            const dadosCorpoInvalidos = { quantidade: "muitos" };
            req = mockReq({ id: idValidoParaAtualizar }, {}, dadosCorpoInvalidos);
            InventarioIdSchema.parse.mockReturnValue({ id: idValidoParaAtualizar });
            const validationError = new Error("Erro de validação Zod para Dados de Atualização");
            InventarioUpdateSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.atualizar(req, res)).rejects.toThrow(validationError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValidoParaAtualizar);
            expect(InventarioUpdateSchema.parse).toHaveBeenCalledWith(dadosCorpoInvalidos);
            expect(InventarioService.prototype.atualizar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se o serviço atualizar lançar um erro", async () => {
            req = mockReq({ id: idValidoParaAtualizar }, {}, dadosCorpoParaAtualizar);
            const dadosIdParseados = { id: idValidoParaAtualizar };
            const dadosUpdateParseados = { ...dadosCorpoParaAtualizar };
            InventarioIdSchema.parse.mockReturnValue(dadosIdParseados);
            InventarioUpdateSchema.parse.mockReturnValue(dadosUpdateParseados);

            const serviceError = new Error("Erro no serviço de atualização");
            InventarioService.prototype.atualizar.mockRejectedValue(serviceError);

            await expect(controller.atualizar(req, res)).rejects.toThrow(serviceError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValidoParaAtualizar);
            expect(InventarioUpdateSchema.parse).toHaveBeenCalledWith(dadosCorpoParaAtualizar);
            expect(InventarioService.prototype.atualizar).toHaveBeenCalledWith(
                idValidoParaAtualizar,
                dadosUpdateParseados
            );
        });

        it("deve pular a validação de ID e chamar o serviço com ID undefined se req.params.id não for fornecido", async () => {
            req = mockReq({}, {}, { nome: "update only body" });
            const updateData = { nome: "update only body" };

            InventarioUpdateSchema.parse.mockReturnValue(updateData);
            InventarioService.prototype.atualizar.mockResolvedValue({
                success: true,
                message: "Updated with undefined ID",
            });

            await controller.atualizar(req, res);

            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioUpdateSchema.parse).toHaveBeenCalledWith(updateData);
            expect(InventarioService.prototype.atualizar).toHaveBeenCalledWith(undefined, updateData);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                { success: true, message: "Updated with undefined ID" },
                200,
                "Inventario atualizado com sucesso."
            );
        });
    });

    describe("Deletar Inventário", () => {
        const idValidoParaDeletar = "delete-id-789";

        it("deve deletar um inventário com sucesso com um ID válido", async () => {
            req = mockReq({ id: idValidoParaDeletar }, {}, {});
            const dadosIdParseados = { id: idValidoParaDeletar };
            const resultadoDelecaoMock = { acknowledged: true, deletedCount: 1 };

            InventarioIdSchema.parse.mockReturnValue(dadosIdParseados);
            InventarioService.prototype.deletar.mockResolvedValue(resultadoDelecaoMock);

            await controller.deletar(req, res);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValidoParaDeletar);
            expect(InventarioService.prototype.deletar).toHaveBeenCalledWith(idValidoParaDeletar);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                resultadoDelecaoMock,
                200,
                "Inventario excluído com sucesso."
            );
        });

        it("deve propagar erro se a validação do ID (Deletar) falhar", async () => {
            const idInvalido = "invalid-delete-id";
            req = mockReq({ id: idInvalido }, {}, {});
            const validationError = new Error("Erro de validação Zod para ID de Deleção");
            InventarioIdSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.deletar(req, res)).rejects.toThrow(validationError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idInvalido);
            expect(InventarioService.prototype.deletar).not.toHaveBeenCalled();
        });

        it("deve propagar erro se o serviço deletar lançar um erro", async () => {
            req = mockReq({ id: idValidoParaDeletar }, {}, {});
            const dadosIdParseados = { id: idValidoParaDeletar };
            InventarioIdSchema.parse.mockReturnValue(dadosIdParseados);

            const serviceError = new Error("Erro no serviço de deleção");
            InventarioService.prototype.deletar.mockRejectedValue(serviceError);

            await expect(controller.deletar(req, res)).rejects.toThrow(serviceError);

            expect(InventarioIdSchema.parse).toHaveBeenCalledWith(idValidoParaDeletar);
            expect(InventarioService.prototype.deletar).toHaveBeenCalledWith(idValidoParaDeletar);
        });

        it("deve pular a validação de ID e chamar o serviço com ID undefined se req.params.id não for fornecido", async () => {
            req = mockReq({}, {}, {});

            InventarioService.prototype.deletar.mockResolvedValue({
                success: true,
                message: "Deleted with undefined ID",
            });

            await controller.deletar(req, res);

            expect(InventarioIdSchema.parse).not.toHaveBeenCalled();
            expect(InventarioService.prototype.deletar).toHaveBeenCalledWith(undefined);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                { success: true, message: "Deleted with undefined ID" },
                200,
                "Inventario excluído com sucesso."
            );
        });
    });
});
