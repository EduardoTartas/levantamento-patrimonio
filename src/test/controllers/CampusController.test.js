// src/tests/controllers/CampusController.test.js
import { afterEach, beforeEach, describe, jest, expect } from "@jest/globals";
import { CommonResponse } from "@utils/helpers/CommonResponse.js";
import { CampusIdSchema, CampusQuerySchema } from "@utils/validators/schemas/zod/querys";
import { CampusSchema, CampusUpdateSchema } from "@utils/validators/schemas/zod";
import CampusController from "@controllers/CampusController.js";


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
        res = mockResponse();

        // Mock os métodos do service
        controller.service.listar = jest.fn();
        controller.service.criar = jest.fn();
        controller.service.atualizar = jest.fn();
        controller.service.deletar = jest.fn();
    })
})

// Ao final de cada teste, cada mock, spies, e funções simuladas sejam resetadas.
afterEach(() => jest.clearAllMocks());

it('deve listar campus', async () => {
    req.params = { id: '123' };
    req.query = { nome: 'teste' };

    // Simula o comportamento dos esquemas de validação, ambos retornam sucesso.
    CampusIdSchema.parse.mockReturnValue(true);
    CampusQuerySchema.parseAsync.mockResolvedValue(true);

    // Define um retorno simulado. como se viesse do banco de dados
    const mockData = [{ id: 1, nome: 'Campus 1' }];
    controller.service.listar.mockResolvedValue(mockData);

    await controller.listar(req, res);

    expect(CampusIdSchema.parse).toHaveBeenCalledWith('123');
    expect(CampusQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: 'teste' });
    expect(controller.service.listar).toHaveBeenCalledWith(req);
    expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
});

it('deve criar campus', async () => {
    const parsed = { nome: 'Novo Campus' };
    req.body = parsed;

    CampusSchema.parse.mockReturnValue(parsed);// Induzindo um retorno de função
    
    const mockData = { id: 1, nome: 'Novo Campus' };
    controller.service.criar.mockResolvedValue(mockData);

    await controller.criar(req, res);

    expect(CampusSchema.parse).toHaveBeenCalledWith(parsed);
    expect(controller.service.criar).toHaveBeenCalledWith(parsed);
    expect(CommonResponse.created).toHaveBeenCalledWith(res, mockData);
});

it('deve atualizar campus', async () => {
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
    expect(controller.service.atualizar).toHaveBeenCalledWith('123', parsed);
    expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
});

it('deve deletar campus', async () => {
    req.params = { id: '123' };
    CampusIdSchema.parse.mockReturnValue(true);

    const mockData = { message: 'Deletado' };
    controller.service.deletar.mockResolvedValue(mockData);

    await controller.deletar(req, res);

    expect(CampusIdSchema.parse).toHaveBeenCalledWith('123');
    expect(controller.service.deletar).toHaveBeenCalledWith('123');
    expect(CommonResponse.success).toHaveBeenCalledWith(
        res,
        mockData,
        200,
        'Unidade deletada com sucesso'
    );
});