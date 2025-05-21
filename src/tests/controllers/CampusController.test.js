// src/tests/controllers/CampusController.test.js
import { afterEach, beforeEach, describe, jest } from "@jest/globals";

import { CommonResponse, CustomError, HttpStatusCodes } from "@utils/helpers.js";
import { CampusIdSchema, CampusQuerySchema } from "@utils/validators/schemas/zod/querys/CampusQuerySchema.js";
import { CampusSchema, CampusUpdateSchema } from "@utils/validators/schemas/zod/CampusSchema.js";
import CampusController from "@controllers/CampusController.js";
import CampusService from "services/CampusService.js";
import { query } from "winston";


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
    CampusSchema: { parse: jest.fn() },
    CampusUpdateSchema: { parse: jest.fn() }
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
        res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

        // Mock os métodos do service
        controller.service.listar = jest.fn();
        controller.service.criar = jest.fn();
        controller.service.atualizar = jest.fn();
        controller.service.deletar = jest.fn();
    })
})

// Ao final de cada teste, cada mock, spies, e funções simuladas sejam resetadas.
afterEach(() => jest.clearAllMocks());