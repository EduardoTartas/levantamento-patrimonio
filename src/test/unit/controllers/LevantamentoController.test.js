import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import LevantamentoController from '@controllers/LevantamentoController.js';
import LevantamentoService from '@services/LevantamentoService.js';
import { CommonResponse, CustomError, HttpStatusCodes } from '@utils/helpers/index.js';
import { LevantamentoQuerySchema, LevantamentoIdSchema } from '@utils/validators/schemas/zod/querys/LevantamentoQuerySchema.js';
import { LevantamentoSchema, LevantamentoUpdateSchema, fotoUploadValidationSchema } from '@utils/validators/schemas/zod/LevantamentoSchema.js';

jest.mock('@services/LevantamentoService.js');
jest.mock('@utils/helpers/index.js');
jest.mock('@utils/validators/schemas/zod/querys/LevantamentoQuerySchema.js');
jest.mock('@utils/validators/schemas/zod/LevantamentoSchema.js');

describe('LevantamentoController', () => {
    let controller;
    let req;
    let res;
    let mockLevantamentoService;

    beforeEach(() => {
        mockLevantamentoService = {
            listar: jest.fn(),
            criar: jest.fn(),
            atualizar: jest.fn(),
            deletar: jest.fn(),
            adicionarFoto: jest.fn(),
            deletarFoto: jest.fn()
        };
        LevantamentoService.mockImplementation(() => mockLevantamentoService);
        
        controller = new LevantamentoController();
        controller.service = mockLevantamentoService;

        req = {
            params: {},
            query: {},
            body: {},
            user: { _id: 'user123' },
            file: null
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        CommonResponse.success = jest.fn();
        CommonResponse.created = jest.fn();
        CommonResponse.error = jest.fn();
        LevantamentoIdSchema.parse = jest.fn();
        LevantamentoQuerySchema.parseAsync = jest.fn();
        LevantamentoSchema.parse = jest.fn();
        LevantamentoUpdateSchema.parse = jest.fn();
        fotoUploadValidationSchema.parse = jest.fn();
        
        // Mock das classes de erro
        CustomError.mockImplementation((error) => error);
        HttpStatusCodes.BAD_REQUEST = { code: 400 };
        HttpStatusCodes.OK = { code: 200 };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('deve criar instância do LevantamentoController com service', () => {
            const newController = new LevantamentoController();
            expect(newController).toBeInstanceOf(LevantamentoController);
            expect(newController.service).toBeDefined();
        });
    });

    describe('listar', () => {
        const mockLevantamentos = [
            { 
                id: '507f1f77bcf86cd799439011', 
                inventario: '507f1f77bcf86cd799439012',
                bem: { nome: 'Mesa', tombo: 'TOM123' },
                estado: 'Em condições de uso'
            },
            { 
                id: '507f1f77bcf86cd799439013', 
                inventario: '507f1f77bcf86cd799439014',
                bem: { nome: 'Cadeira', tombo: 'TOM456' },
                estado: 'Danificado'
            }
        ];

        describe('Casos de sucesso', () => {
            it('deve listar levantamentos sem parâmetros', async () => {
                controller.service.listar.mockResolvedValue(mockLevantamentos);

                await controller.listar(req, res);

                expect(LevantamentoIdSchema.parse).not.toHaveBeenCalled();
                expect(LevantamentoQuerySchema.parseAsync).not.toHaveBeenCalled();
                expect(controller.service.listar).toHaveBeenCalledWith(req);
                expect(CommonResponse.success).toHaveBeenCalledWith(res, mockLevantamentos);
            });

            it('deve listar levantamento específico com ID válido', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                const mockLevantamento = mockLevantamentos[0];
                controller.service.listar.mockResolvedValue(mockLevantamento);
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');

                await controller.listar(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(LevantamentoQuerySchema.parseAsync).not.toHaveBeenCalled();
                expect(controller.service.listar).toHaveBeenCalledWith(req);
                expect(CommonResponse.success).toHaveBeenCalledWith(res, mockLevantamento);
            });

            it('deve listar levantamentos com query parameters válidos', async () => {
                req.query = { estado: 'Em condições de uso', page: '1', limite: '10' };
                controller.service.listar.mockResolvedValue(mockLevantamentos);
                LevantamentoQuerySchema.parseAsync.mockResolvedValue(req.query);

                await controller.listar(req, res);

                expect(LevantamentoQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
                expect(LevantamentoIdSchema.parse).not.toHaveBeenCalled();
                expect(controller.service.listar).toHaveBeenCalledWith(req);
                expect(CommonResponse.success).toHaveBeenCalledWith(res, mockLevantamentos);
            });

            it('deve listar com ID e query simultaneamente', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.query = { includeDetails: true };
                const mockResult = { ...mockLevantamentos[0], detalhes: {} };
                controller.service.listar.mockResolvedValue(mockResult);
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                LevantamentoQuerySchema.parseAsync.mockResolvedValue(req.query);

                await controller.listar(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(LevantamentoQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
                expect(controller.service.listar).toHaveBeenCalledWith(req);
                expect(CommonResponse.success).toHaveBeenCalledWith(res, mockResult);
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para ID inválido', async () => {
                req.params.id = 'id-invalido';
                const error = new Error('ID inválido');
                LevantamentoIdSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.listar(req, res)).rejects.toThrow('ID inválido');

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('id-invalido');
                expect(controller.service.listar).not.toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });

            it('deve lançar erro para query inválida', async () => {
                req.query = { page: 'invalid', limite: '-1' };
                const error = new Error('Query parameters inválidos');
                LevantamentoQuerySchema.parseAsync.mockRejectedValue(error);

                await expect(controller.listar(req, res)).rejects.toThrow('Query parameters inválidos');

                expect(LevantamentoQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
                expect(controller.service.listar).not.toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                const serviceError = new Error('Erro interno do service');
                controller.service.listar.mockRejectedValue(serviceError);

                await expect(controller.listar(req, res)).rejects.toThrow('Erro interno do service');

                expect(controller.service.listar).toHaveBeenCalledWith(req);
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });
        });
    });

    describe('criar', () => {
        const mockLevantamentoData = {
            inventario: '507f1f77bcf86cd799439012',
            bemId: '507f1f77bcf86cd799439013',
            estado: 'Em condições de uso',
            ocioso: false
        };

        describe('Casos de sucesso', () => {
            it('deve criar levantamento com dados válidos', async () => {
                req.body = mockLevantamentoData;
                const parsedData = { ...mockLevantamentoData, usuario: 'user123' };
                const createdLevantamento = { id: '507f1f77bcf86cd799439014', ...parsedData };
                
                LevantamentoSchema.parse.mockReturnValue(mockLevantamentoData);
                controller.service.criar.mockResolvedValue(createdLevantamento);

                await controller.criar(req, res);

                expect(LevantamentoSchema.parse).toHaveBeenCalledWith(req.body);
                expect(controller.service.criar).toHaveBeenCalledWith(parsedData);
                expect(CommonResponse.created).toHaveBeenCalledWith(res, createdLevantamento);
            });

            it('deve adicionar userId do usuário logado aos dados', async () => {
                req.body = mockLevantamentoData;
                req.user._id = 'different-user-id';
                const expectedData = { ...mockLevantamentoData, usuario: 'different-user-id' };
                
                LevantamentoSchema.parse.mockReturnValue(mockLevantamentoData);
                controller.service.criar.mockResolvedValue({ id: '123', ...expectedData });

                await controller.criar(req, res);

                expect(controller.service.criar).toHaveBeenCalledWith(expectedData);
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para dados inválidos', async () => {
                req.body = { estado: 'Estado Inválido' };
                const error = new Error('Dados de levantamento inválidos');
                LevantamentoSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.criar(req, res)).rejects.toThrow('Dados de levantamento inválidos');

                expect(LevantamentoSchema.parse).toHaveBeenCalledWith(req.body);
                expect(controller.service.criar).not.toHaveBeenCalled();
                expect(CommonResponse.created).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                req.body = mockLevantamentoData;
                LevantamentoSchema.parse.mockReturnValue(mockLevantamentoData);
                const serviceError = new Error('Erro ao criar levantamento');
                controller.service.criar.mockRejectedValue(serviceError);

                await expect(controller.criar(req, res)).rejects.toThrow('Erro ao criar levantamento');

                expect(controller.service.criar).toHaveBeenCalled();
                expect(CommonResponse.created).not.toHaveBeenCalled();
            });
        });
    });

    describe('atualizar', () => {
        const mockUpdateData = {
            estado: 'Danificado',
            ocioso: true
        };

        describe('Casos de sucesso', () => {
            it('deve atualizar levantamento com dados válidos', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.body = mockUpdateData;
                const updatedLevantamento = { id: '507f1f77bcf86cd799439011', ...mockUpdateData };
                
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                LevantamentoUpdateSchema.parse.mockReturnValue(mockUpdateData);
                controller.service.atualizar.mockResolvedValue(updatedLevantamento);

                await controller.atualizar(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(LevantamentoUpdateSchema.parse).toHaveBeenCalledWith(req.body);
                expect(controller.service.atualizar).toHaveBeenCalledWith('507f1f77bcf86cd799439011', mockUpdateData);
                expect(CommonResponse.success).toHaveBeenCalledWith(
                    res,
                    updatedLevantamento,
                    HttpStatusCodes.OK.code,
                    "Levantamento atualizado com sucesso. Porém, novos id de bens e invenatarios são ignorado em tentativas de atualização, pois é opração proibida."
                );
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para ID inválido', async () => {
                req.params.id = 'id-invalido';
                req.body = mockUpdateData;
                const error = new Error('ID inválido');
                LevantamentoIdSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.atualizar(req, res)).rejects.toThrow('ID inválido');

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('id-invalido');
                expect(LevantamentoUpdateSchema.parse).not.toHaveBeenCalled();
                expect(controller.service.atualizar).not.toHaveBeenCalled();
            });

            it('deve lançar erro para dados de atualização inválidos', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.body = { estado: 'Estado Inválido' };
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                const error = new Error('Dados de atualização inválidos');
                LevantamentoUpdateSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.atualizar(req, res)).rejects.toThrow('Dados de atualização inválidos');

                expect(LevantamentoUpdateSchema.parse).toHaveBeenCalledWith(req.body);
                expect(controller.service.atualizar).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.body = mockUpdateData;
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                LevantamentoUpdateSchema.parse.mockReturnValue(mockUpdateData);
                const serviceError = new Error('Erro ao atualizar levantamento');
                controller.service.atualizar.mockRejectedValue(serviceError);

                await expect(controller.atualizar(req, res)).rejects.toThrow('Erro ao atualizar levantamento');

                expect(controller.service.atualizar).toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });
        });
    });

    describe('deletar', () => {
        describe('Casos de sucesso', () => {
            it('deve deletar levantamento com ID válido', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                const deleteResult = { deletedCount: 1 };
                
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                controller.service.deletar.mockResolvedValue(deleteResult);

                await controller.deletar(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(controller.service.deletar).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(CommonResponse.success).toHaveBeenCalledWith(
                    res,
                    deleteResult,
                    HttpStatusCodes.OK.code,
                    "Levantamento excluído com sucesso."
                );
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para ID inválido', async () => {
                req.params.id = 'id-invalido';
                const error = new Error('ID inválido');
                LevantamentoIdSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.deletar(req, res)).rejects.toThrow('ID inválido');

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('id-invalido');
                expect(controller.service.deletar).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                const serviceError = new Error('Erro ao deletar levantamento');
                controller.service.deletar.mockRejectedValue(serviceError);

                await expect(controller.deletar(req, res)).rejects.toThrow('Erro ao deletar levantamento');

                expect(controller.service.deletar).toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });
        });
    });

    describe('adicionarFoto', () => {
        const mockFile = {
            fieldname: 'foto',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake image data'),
            size: 1024
        };

        describe('Casos de sucesso', () => {
            it('deve adicionar foto com arquivo válido', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.file = mockFile;
                const result = { message: 'Foto adicionada', url: 'http://example.com/photo.jpg' };
                
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                fotoUploadValidationSchema.parse.mockReturnValue(mockFile);
                controller.service.adicionarFoto.mockResolvedValue(result);

                await controller.adicionarFoto(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(fotoUploadValidationSchema.parse).toHaveBeenCalledWith(mockFile);
                expect(controller.service.adicionarFoto).toHaveBeenCalledWith('507f1f77bcf86cd799439011', mockFile);
                expect(CommonResponse.success).toHaveBeenCalledWith(
                    res,
                    result,
                    HttpStatusCodes.OK.code,
                    "Foto adicionada com sucesso."
                );
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para ID inválido', async () => {
                req.params.id = 'id-invalido';
                req.file = mockFile;
                const error = new Error('ID inválido');
                LevantamentoIdSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.adicionarFoto(req, res)).rejects.toThrow('ID inválido');

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('id-invalido');
                expect(fotoUploadValidationSchema.parse).not.toHaveBeenCalled();
                expect(controller.service.adicionarFoto).not.toHaveBeenCalled();
            });

            it('deve lançar erro quando nenhum arquivo é enviado', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.file = null;
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');

                await expect(controller.adicionarFoto(req, res)).rejects.toEqual({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: "validationError",
                    field: "foto",
                    customMessage: "Nenhum arquivo enviado. Por favor, inclua um arquivo."
                });

                expect(fotoUploadValidationSchema.parse).not.toHaveBeenCalled();
                expect(controller.service.adicionarFoto).not.toHaveBeenCalled();
            });

            it('deve lançar erro para arquivo inválido', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.file = { ...mockFile, mimetype: 'text/plain' };
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                const error = new Error('Arquivo inválido');
                fotoUploadValidationSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.adicionarFoto(req, res)).rejects.toThrow('Arquivo inválido');

                expect(fotoUploadValidationSchema.parse).toHaveBeenCalledWith(req.file);
                expect(controller.service.adicionarFoto).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                req.file = mockFile;
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                fotoUploadValidationSchema.parse.mockReturnValue(mockFile);
                const serviceError = new Error('Erro ao adicionar foto');
                controller.service.adicionarFoto.mockRejectedValue(serviceError);

                await expect(controller.adicionarFoto(req, res)).rejects.toThrow('Erro ao adicionar foto');

                expect(controller.service.adicionarFoto).toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });
        });
    });

    describe('deletarFoto', () => {
        describe('Casos de sucesso', () => {
            it('deve deletar fotos com ID válido', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                const result = { message: 'Fotos removidas' };
                
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                controller.service.deletarFoto.mockResolvedValue(result);

                await controller.deletarFoto(req, res);

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(controller.service.deletarFoto).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(CommonResponse.success).toHaveBeenCalledWith(
                    res,
                    result,
                    HttpStatusCodes.OK.code,
                    "Fotos removidas com sucesso."
                );
            });
        });

        describe('Casos de erro', () => {
            it('deve lançar erro para ID inválido', async () => {
                req.params.id = 'id-invalido';
                const error = new Error('ID inválido');
                LevantamentoIdSchema.parse.mockImplementation(() => { throw error; });

                await expect(controller.deletarFoto(req, res)).rejects.toThrow('ID inválido');

                expect(LevantamentoIdSchema.parse).toHaveBeenCalledWith('id-invalido');
                expect(controller.service.deletarFoto).not.toHaveBeenCalled();
            });

            it('deve propagar erro do service', async () => {
                req.params.id = '507f1f77bcf86cd799439011';
                LevantamentoIdSchema.parse.mockReturnValue('507f1f77bcf86cd799439011');
                const serviceError = new Error('Erro ao deletar fotos');
                controller.service.deletarFoto.mockRejectedValue(serviceError);

                await expect(controller.deletarFoto(req, res)).rejects.toThrow('Erro ao deletar fotos');

                expect(controller.service.deletarFoto).toHaveBeenCalled();
                expect(CommonResponse.success).not.toHaveBeenCalled();
            });
        });
    });
});
