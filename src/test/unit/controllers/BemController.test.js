import { afterEach, beforeEach, describe, jest, expect } from "@jest/globals";
import { CommonResponse } from "@utils/helpers";
import { BemIdSchema, BemQuerySchema } from "@utils/validators/schemas/zod/querys/BemQuerySchema";
import BemController from "@controllers/BemController";

jest.mock('@services/BemService.js')
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

jest.mock('@utils/validators/schemas/zod/querys/BemQuerySchema.js', () => ({
    BemIdSchema: { parse: jest.fn() },
    BemQuerySchema: { parseAsync: jest.fn() }
}));

describe('BemController', () => {
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
        controller = new BemController();
        req = { params: {}, query: {}, body: {} };
        res = mockResponse();

        // Mock para os métodos do service
        controller.service.listar = jest.fn();
    })

    // Ao final de cada teste, cada mock, spies, e funções simuladas sejam resetadas.
    afterEach(() => jest.clearAllMocks());

    /*
    * Testes do BemController para validar operações de listagem:
     - Listar bens com ou sem ID e parâmetros de query, incluindo casos com req.params undefined ou null;
     - Validação dos esquemas de ID e query;
     - Tratamento de erros de validação.
    */
    describe('Listar', () => {
        it('deve listar bens com id e query', async () => {
            req.params = { id: '507f1f77bcf86cd799439011' };
            req.query = { nome: 'Mesa', auditado: 'true' };

            BemIdSchema.parse.mockReturnValue(true);
            BemQuerySchema.parseAsync.mockResolvedValue(true);

            const mockData = [{ 
                id: '507f1f77bcf86cd799439011', 
                nome: 'Mesa de Escritório',
                valor: 250.50,
                auditado: true
            }];
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            expect(BemIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: 'Mesa', auditado: 'true' });
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        it('deve listar bens sem id e sem query', async () => {
            req.params = {};
            req.query = {};

            const mockData = [
                { 
                    id: '507f1f77bcf86cd799439011', 
                    nome: 'Mesa de Escritório',
                    valor: 250.50,
                    auditado: false
                },
                { 
                    id: '507f1f77bcf86cd799439012', 
                    nome: 'Cadeira Ergonômica',
                    valor: 180.00,
                    auditado: true
                }
            ];
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            // Não espera chamadas às validações de ID ou Query
            expect(BemIdSchema.parse).not.toHaveBeenCalled();
            expect(BemQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        it('deve listar bens quando req.params é undefined ou null', async () => {
            req.params = undefined;
            req.query = {};
            const mockData = [{ 
                id: '507f1f77bcf86cd799439011', 
                nome: 'Bem sem id específico',
                valor: 100.00,
                auditado: false
            }];
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            expect(BemIdSchema.parse).not.toHaveBeenCalled();
            expect(BemQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        it('deve listar bens com apenas query (sem id)', async () => {
            req.params = {};
            req.query = { 
                nome: 'Mesa',
                tombo: 'TOM123',
                auditado: 'false',
                page: '1',
                limite: '10'
            };

            BemQuerySchema.parseAsync.mockResolvedValue(true);

            const mockData = {
                docs: [
                    { 
                        id: '507f1f77bcf86cd799439011', 
                        nome: 'Mesa de Reunião',
                        tombo: 'TOM123456',
                        valor: 350.00,
                        auditado: false
                    }
                ],
                totalDocs: 1,
                limit: 10,
                page: 1,
                totalPages: 1
            };
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            expect(BemIdSchema.parse).not.toHaveBeenCalled();
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({
                nome: 'Mesa',
                tombo: 'TOM123',
                auditado: 'false',
                page: '1',
                limite: '10'
            });
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        it('deve listar bens com apenas id (sem query)', async () => {
            req.params = { id: '507f1f77bcf86cd799439011' };
            req.query = {};

            BemIdSchema.parse.mockReturnValue(true);

            const mockData = { 
                id: '507f1f77bcf86cd799439011', 
                nome: 'Mesa Específica',
                tombo: 'TOM789',
                responsavel: {
                    nome: 'João da Silva',
                    cpf: '12345678909'
                },
                valor: 275.50,
                auditado: true
            };
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            expect(BemIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(BemQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        it('deve lançar erro se id inválido, no listar', async () => {
            req.params = { id: 'abc123' };
            BemIdSchema.parse.mockImplementation(() => { 
                throw new Error('ID inválido') 
            });

            await expect(controller.listar(req, res)).rejects.toThrow('ID inválido');
            expect(BemIdSchema.parse).toHaveBeenCalledWith('abc123');
            expect(controller.service.listar).not.toHaveBeenCalled();
        });

        it('deve lançar erro se query inválida, no listar', async () => {
            req.params = {};
            req.query = { page: 'not-a-number', limite: 'invalid' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Query inválida'));

            await expect(controller.listar(req, res)).rejects.toThrow('Query inválida');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ 
                page: 'not-a-number', 
                limite: 'invalid' 
            });
            expect(controller.service.listar).not.toHaveBeenCalled();
        });

        it('deve lançar erro se auditado tiver valor inválido', async () => {
            req.params = {};
            req.query = { auditado: 'maybe' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error("Auditado deve ser 'true' ou 'false'"));

            await expect(controller.listar(req, res)).rejects.toThrow("Auditado deve ser 'true' ou 'false'");
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ auditado: 'maybe' });
        });

        it('deve lançar erro se page for inválida', async () => {
            req.params = {};
            req.query = { page: '0' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Page deve ser um número inteiro maior que 0'));

            await expect(controller.listar(req, res)).rejects.toThrow('Page deve ser um número inteiro maior que 0');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ page: '0' });
        });

        it('deve lançar erro se limite for inválido', async () => {
            req.params = {};
            req.query = { limite: '150' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Limite deve ser um número inteiro entre 1 e 100'));

            await expect(controller.listar(req, res)).rejects.toThrow('Limite deve ser um número inteiro entre 1 e 100');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ limite: '150' });
        });

        it('deve lançar erro se nome for string vazia', async () => {
            req.params = {};
            req.query = { nome: '   ' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Nome não pode ser vazio'));

            await expect(controller.listar(req, res)).rejects.toThrow('Nome não pode ser vazio');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ nome: '   ' });
        });

        it('deve lançar erro se tombo for string vazia', async () => {
            req.params = {};
            req.query = { tombo: '   ' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Tombo não pode ser vazio'));

            await expect(controller.listar(req, res)).rejects.toThrow('Tombo não pode ser vazio');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ tombo: '   ' });
        });

        it('deve lançar erro se sala for string vazia', async () => {
            req.params = {};
            req.query = { sala: '   ' };
            BemQuerySchema.parseAsync.mockRejectedValue(new Error('Sala não pode ser vazio'));

            await expect(controller.listar(req, res)).rejects.toThrow('Sala não pode ser vazio');
            expect(BemQuerySchema.parseAsync).toHaveBeenCalledWith({ sala: '   ' });
        });

        // Teste para verificar se req.query vazio não chama validação
        it('deve não chamar validação de query quando req.query é objeto vazio', async () => {
            req.params = {};
            req.query = {};

            const mockData = [];
            controller.service.listar.mockResolvedValue(mockData);

            await controller.listar(req, res);

            expect(BemQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, mockData);
        });

        // Teste para verificar comportamento quando service.listar falha
        it('deve propagar erro do service', async () => {
            req.params = {};
            req.query = {};

            const serviceError = new Error('Erro interno do serviço');
            controller.service.listar.mockRejectedValue(serviceError);

            await expect(controller.listar(req, res)).rejects.toThrow('Erro interno do serviço');
            expect(controller.service.listar).toHaveBeenCalledWith(req);
        });
    });
});
