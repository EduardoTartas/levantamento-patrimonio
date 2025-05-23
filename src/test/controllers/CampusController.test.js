// src/tests/controllers/CampusController.test.js
import { afterEach, beforeEach, describe, jest, expect } from "@jest/globals";
import { CommonResponse } from "@utils/helpers";
import { CampusIdSchema, CampusQuerySchema } from "@utils/validators/schemas/zod/querys/CampusQuerySchema";
import { CampusSchema, CampusUpdateSchema } from "@utils/validators/schemas/zod/CampusSchema";
import CampusController from "@controllers/CampusController";

jest.mock('@services/CampusService.js') // Mocka o service
jest.mock('@utils/helpers/index.js', () => ({
    CommonResponse: {
        success: jest.fn(),
        created: jest.fn()
    },
    CustomError: jest.fn(),
    HttpStatusCodes: {
        BAD_REQUEST: 400
    }
}));

jest.mock('@utils/validators/schemas/zod/CampusSchema.js', () => ({
    // Mokando as validações do zod, para garantir que o controller esta usando o zod corretamente.
    CampusSchema: { parse: jest.fn() },
    CampusUpdateSchema: { parse: jest.fn() }
}));

jest.mock('@utils/validators/schemas/zod/querys/CampusQuerySchema.js', () => ({
    CampusIdSchema: { parse: jest.fn() },
    CampusQuerySchema: { parseAsync: jest.fn() }
}));

describe('CampusController', () => {
    // Mock da resposta do express. Permite testar os controllers sem a necessidade de um servidor real
    const mockResponse = () => {
        const res = {};
        // Encadeamento
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res
    }

    let controller;
    let req, res;

    beforeEach(() => {
        controller = new CampusController();
        req = { params: {}, query: {}, body: {} };
        res = mockResponse()
        res = mockResponse();

        // Mock para os métodos do service
        controller.service.listar = jest.fn();
        controller.service.criar = jest.fn();
        controller.service.atualizar = jest.fn();
        controller.service.deletar = jest.fn();
    })

    // Ao final de cada teste, cada mock, spies, e funções simuladas sejam resetadas.
    afterEach(() => jest.clearAllMocks());

/*
* Testes do CampusController para validar operações CRUD e listagem:
 - Listar campus com ou sem ID e parâmetros de query, incluindo casos com req.params undefined ou null;
 - Criar campus com validação do corpo da requisição;
 - Atualizar campus com ou sem ID, validando parâmetros e corpo;
 - Deletar campus com ou sem ID, assegurando chamadas corretas das validações e respostas.
*/
    it('deve listar campus com id e query', async () => {
        req.params = { id: '123' };
        req.query = { nome: 'teste' };

        CampusIdSchema.parse.mockReturnValue(true);
        CampusQuerySchema.parseAsync.mockResolvedValue(true);

        const mockData = [{ id: 1, nome: 'Campus 1' }];
        controller.service.listar.mockResolvedValue(mockData);

        await controller.listar(req, res);

        expect(CampusIdSchema.parse).toHaveBeenCalledWith('123');
        expect(CampusQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: 'teste' });
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
    });

    it('deve listar campus sem id e sem query', async () => {
        req.params = {};
        req.query = {};

        const mockData = [{ id: 1, nome: 'Campus 2' }];
        controller.service.listar.mockResolvedValue(mockData);

        await controller.listar(req, res);

        // Não espera chamadas às validações de ID ou Query
        expect(CampusIdSchema.parse).not.toHaveBeenCalled();
        expect(CampusQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
    });

    it('deve listar campus quando req.params é undefined ou null', async () => {
        req.params = undefined;
        req.query = {};
        const mockData = [{ id: 1, nome: 'Campus sem id' }];
        controller.service.listar.mockResolvedValue(mockData);

        await controller.listar(req, res);

        expect(CampusIdSchema.parse).not.toHaveBeenCalled();
        expect(CampusQuerySchema.parseAsync).not.toHaveBeenCalled();
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
    });

    it('deve criar campus', async () => {
        const parsed = { nome: 'Novo Campus' };
        req.body = parsed;

        CampusSchema.parse.mockReturnValue(parsed);
        const mockData = { id: 1, nome: 'Novo Campus' };
        controller.service.criar.mockResolvedValue(mockData);

        await controller.criar(req, res);

        expect(CampusSchema.parse).toHaveBeenCalledWith(parsed);
        expect(CommonResponse.created).toHaveBeenCalledWith(res, mockData);
    });

    it('deve atualizar campus com id', async () => {
        req.params = { id: '123' };
        req.body = { nome: 'Atualizado' };
        const parsed = { nome: 'Atualizado' };

        CampusIdSchema.parse.mockReturnValue(true);
        CampusUpdateSchema.parse.mockReturnValue(parsed);

        const mockData = { id: '123', nome: 'Atualizado' };
        controller.service.atualizar.mockResolvedValue(mockData);

        await controller.atualizar(req, res);

        expect(CampusIdSchema.parse).toHaveBeenCalledWith('123');
        expect(CampusUpdateSchema.parse).toHaveBeenCalledWith({ nome: 'Atualizado' });
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
    });

    it('deve atualizar campus sem id', async () => {
        req.params = {}; // sem ID
        req.body = { nome: 'Atualizado' };
        const parsed = { nome: 'Atualizado' };

        CampusUpdateSchema.parse.mockReturnValue(parsed);
        const mockData = { id: null, nome: 'Atualizado' };
        controller.service.atualizar.mockResolvedValue(mockData);

        await controller.atualizar(req, res);

        expect(CampusIdSchema.parse).not.toHaveBeenCalled();
        expect(CampusUpdateSchema.parse).toHaveBeenCalledWith({ nome: 'Atualizado' });
        expect(controller.service.atualizar).toHaveBeenCalledWith(undefined, parsed);
        expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
    });

    it('deve deletar campus com id', async () => {
        req.params = { id: '123' };
        CampusIdSchema.parse.mockReturnValue(true);

        const mockData = { message: 'Deletado' };
        controller.service.deletar.mockResolvedValue(mockData);

        await controller.deletar(req, res);

        expect(CampusIdSchema.parse).toHaveBeenCalledWith('123');
        expect(CommonResponse.success).toHaveBeenCalledWith(
            res,
            mockData,
            200,
            'Unidade deletada com sucesso'
        );
    });

    it('deve deletar campus sem id', async () => {
        req.params = {};

        const mockData = { message: 'Deletado' };
        controller.service.deletar.mockResolvedValue(mockData);

        await controller.deletar(req, res);

        expect(CampusIdSchema.parse).not.toHaveBeenCalled();
        expect(controller.service.deletar).toHaveBeenCalledWith(undefined);
        expect(CommonResponse.success).toHaveBeenCalledWith(
            res,
            mockData,
            200,
            'Unidade deletada com sucesso'
        );
    });

/*
 - Testes de tratamento de erros para validações de ID, query e corpo inválidos nos métodos listar, criar e atualizar
*/
    it('deve lançar erro se id inválido no listar', async () => {
        req.params = { id: 'abc' };
        CampusIdSchema.parse.mockImplementation(() => { throw new Error('ID inválido') });

        await expect(controller.listar(req, res)).rejects.toThrow('ID inválido');
        expect(CampusIdSchema.parse).toHaveBeenCalledWith('abc');
    });

    it('deve lançar erro se query inválida no listar', async () => {
        req.query = { page: 'not-a-number' };
        CampusQuerySchema.parseAsync.mockRejectedValue(new Error('Query inválida'));

        await expect(controller.listar(req, res)).rejects.toThrow('Query inválida');
        expect(CampusQuerySchema.parseAsync).toHaveBeenCalledWith({ page: 'not-a-number' });
    });

    it('deve lançar erro se body inválido no criar', async () => {
        req.body = { nome: '' };
        CampusSchema.parse.mockImplementation(() => { throw new Error('Body inválido') });

        await expect(controller.criar(req, res)).rejects.toThrow('Body inválido');
        expect(CampusSchema.parse).toHaveBeenCalledWith({ nome: '' });
    });

    it('deve lançar erro se body inválido no atualizar', async () => {
        req.params = { id: '123' };
        req.body = { nome: '' };
        CampusIdSchema.parse.mockReturnValue(true);
        CampusUpdateSchema.parse.mockImplementation(() => { throw new Error('Body inválido') });

        await expect(controller.atualizar(req, res)).rejects.toThrow('Body inválido');
        expect(CampusUpdateSchema.parse).toHaveBeenCalledWith({ nome: '' });
    });

});
