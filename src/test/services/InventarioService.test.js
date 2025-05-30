import InventarioService from '@services/InventarioService';
import InventarioRepository from '@repositories/InventarioRepository';
import CampusService from '@services/CampusService';
import { CustomError, HttpStatusCodes, messages } from '@utils/helpers/index';

jest.mock('@repositories/InventarioRepository');
jest.mock('@services/CampusService');
jest.mock('@utils/helpers/index', () => {
    const originalModule = jest.requireActual('@utils/helpers/index');
    return {
        ...originalModule,
        CustomError: jest.fn().mockImplementation((args) => {
            const err = new Error(args.customMessage || 'Custom Error');
            err.statusCode = args.statusCode;
            err.errorType = args.errorType;
            err.field = args.field;
            err.details = args.details;
            err.customMessage = args.customMessage;
            return err;
        }),
    };
});


describe('InventarioService', () => {
    let service;
    let mockReq;
    let mockInventarioRepository;
    let mockCampusService;

    beforeEach(() => {
        InventarioRepository.mockClear();
        CampusService.mockClear();
        CustomError.mockClear();

        service = new InventarioService();
        mockInventarioRepository = InventarioRepository.mock.instances[0];
        mockCampusService = CampusService.mock.instances[0];

        mockReq = { params: {}, query: {}, body: {} };
    });

    describe('Listar Inventários', () => {
        it('Listar inventários (sucesso)', async () => {
            const mockResponseData = [{ id: '1', nome: 'Inventario 1' }];
            mockInventarioRepository.listar.mockResolvedValue(mockResponseData);

            const result = await service.listar(mockReq);

            expect(mockInventarioRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(result).toEqual(mockResponseData);
        });

        it('Listar inventários (erro no repositório)', async () => {
            const mockError = new Error('Erro no repositório ao listar');
            mockInventarioRepository.listar.mockRejectedValue(mockError);

            await expect(service.listar(mockReq)).rejects.toThrow(mockError);
            expect(mockInventarioRepository.listar).toHaveBeenCalledWith(mockReq);
        });
    });

    describe('Criar Inventário', () => {
        const mockParsedData = {
            nome: 'Novo Inventario',
            campus: 'campusId123',
        };
        const mockInventarioCriado = { id: 'invNew', ...mockParsedData };

         /*APRESENTAR CRIAR SUCESSO*/
        it('Criar inventário (sucesso)', async () => {
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.criar.mockResolvedValue(mockInventarioCriado);

            const result = await service.criar(mockParsedData);

            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockParsedData.campus);
            expect(mockInventarioRepository.criar).toHaveBeenCalledWith(mockParsedData);
            expect(result).toEqual(mockInventarioCriado);
        });

        it('Criar inventário (campus inexistente)', async () => {
            const mockCampusError = new Error('Campus não existe');
            mockCampusService.ensureCampExists.mockRejectedValue(mockCampusError);

            await expect(service.criar(mockParsedData)).rejects.toThrow(mockCampusError);

            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockParsedData.campus);
            expect(mockInventarioRepository.criar).not.toHaveBeenCalled();
        });

        it('Criar inventário (erro no repositório)', async () => {
            const mockRepoError = new Error('Erro no repositório ao criar');
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.criar.mockRejectedValue(mockRepoError);

            await expect(service.criar(mockParsedData)).rejects.toThrow(mockRepoError);

            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockParsedData.campus);
            expect(mockInventarioRepository.criar).toHaveBeenCalledWith(mockParsedData);
        });
    });

    describe('Atualizar Inventário', () => {
        const mockId = 'invExistente123';
        const mockInventarioExistenteAtivo = { id: mockId, nome: 'Antigo', campus: 'campusIdAntigo', status: true };
        const mockInventarioExistenteInativo = { id: mockId, nome: 'Antigo Inativo', campus: 'campusIdAntigo', status: false };

        const mockUpdateDataSemCampus = { nome: 'Inventario Atualizado' };
        const mockUpdateDataComCampus = { nome: 'Inventario Att com Campus', campus: 'campusIdNovo456' };
        const mockInventarioAtualizado = { id: mockId, ...mockUpdateDataSemCampus };

        let ensureInvExistsSpy;
        beforeEach(() => {
             ensureInvExistsSpy = jest.spyOn(service, 'ensureInvExists');
        });
        afterEach(() => {
            ensureInvExistsSpy.mockRestore();
        });


        it('Atualizar inventário (sucesso, sem campus novo)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.atualizar.mockResolvedValue(mockInventarioAtualizado);

            const result = await service.atualizar(mockId, mockUpdateDataSemCampus);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockCampusService.ensureCampExists).not.toHaveBeenCalled();
            expect(mockInventarioRepository.atualizar).toHaveBeenCalledWith(mockId, mockUpdateDataSemCampus);
            expect(result).toEqual(mockInventarioAtualizado);
        });

         /*APRESENTAR ATUALIZAR SUCESSO*/
        it('Atualizar inventário (sucesso, com campus novo)', async () => {
            const mockInventarioAttComCampus = { id: mockId, ...mockUpdateDataComCampus };
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.atualizar.mockResolvedValue(mockInventarioAttComCampus);

            const result = await service.atualizar(mockId, mockUpdateDataComCampus);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockUpdateDataComCampus.campus);
            expect(mockInventarioRepository.atualizar).toHaveBeenCalledWith(mockId, mockUpdateDataComCampus);
            expect(result).toEqual(mockInventarioAttComCampus);
        });

        it('Atualizar inventário (inventário não existe)', async () => {
            const mockIdInexistente = 'invNaoExiste789';
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Inventário",
                customMessage: messages.error.resourceNotFound("Inventário"),
            };

            await expect(service.atualizar(mockIdInexistente, mockUpdateDataSemCampus))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));


            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockIdInexistente);
            expect(mockCampusService.ensureCampExists).not.toHaveBeenCalled();
            expect(mockInventarioRepository.atualizar).not.toHaveBeenCalled();
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Inventário",
            }));
        });

        it('Atualizar inventário (inventário INATIVO)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteInativo);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "invalidOperation",
                field: "status",
                customMessage: "Operação não permitida em inventário inativo.",
            };

            await expect(service.atualizar(mockId, mockUpdateDataSemCampus))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockCampusService.ensureCampExists).not.toHaveBeenCalled();
            expect(mockInventarioRepository.atualizar).not.toHaveBeenCalled();
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining(expectedErrorDetails));
        });


        it('Atualizar inventário (campus novo inexistente)', async () => {
            const mockCampusError = new Error('Campus novo não existe');
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockCampusService.ensureCampExists.mockRejectedValue(mockCampusError);

            await expect(service.atualizar(mockId, mockUpdateDataComCampus)).rejects.toThrow(mockCampusError);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockUpdateDataComCampus.campus);
            expect(mockInventarioRepository.atualizar).not.toHaveBeenCalled();
        });

        it('Atualizar inventário (erro no repositório)', async () => {
            const mockRepoError = new Error('Erro no repositório ao atualizar');
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.atualizar.mockRejectedValue(mockRepoError);

            await expect(service.atualizar(mockId, mockUpdateDataSemCampus)).rejects.toThrow(mockRepoError);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.atualizar).toHaveBeenCalledWith(mockId, mockUpdateDataSemCampus);
        });
    });

    describe('Deletar Inventário', () => {
        const mockId = 'invExistenteParaDeletar';
        const mockInventarioExistenteAtivo = { id: mockId, nome: 'Para Deletar', status: true };
        const mockInventarioExistenteInativo = { id: mockId, nome: 'Inativo Para Deletar', status: false };
        const mockDeleteResponse = { deletedCount: 1 };

        let ensureInvExistsSpy;
        beforeEach(() => {
             ensureInvExistsSpy = jest.spyOn(service, 'ensureInvExists');
        });
        afterEach(() => {
            ensureInvExistsSpy.mockRestore();
        });

        it('Deletar inventário (sucesso)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.deletar.mockResolvedValue(mockDeleteResponse);

            const result = await service.deletar(mockId);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.deletar).toHaveBeenCalledWith(mockId);
            expect(result).toEqual(mockDeleteResponse);
        });

        it('Deletar inventário (inventário não existe)', async () => {
            const mockIdInexistente = 'invNaoExisteParaDeletar';
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Inventário",
            };


            await expect(service.deletar(mockIdInexistente))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockIdInexistente);
            expect(mockInventarioRepository.deletar).not.toHaveBeenCalled();
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining(expectedErrorDetails));
        });

        /*APRESENTAR DELETANDO INATIVO*/
         it('Deletar inventário (inventário INATIVO)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteInativo);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "invalidOperation",
                field: "status",
                customMessage: "Operação não permitida em inventário inativo.",
            };

            await expect(service.deletar(mockId))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.deletar).not.toHaveBeenCalled();
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining(expectedErrorDetails));
        });

        it('Deletar inventário (erro no repositório)', async () => {
            const mockRepoError = new Error('Erro no repositório ao deletar');
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.deletar.mockRejectedValue(mockRepoError);

            await expect(service.deletar(mockId)).rejects.toThrow(mockRepoError);

            expect(ensureInvExistsSpy).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.deletar).toHaveBeenCalledWith(mockId);
        });
    });

    describe('ensureInvExists (Auxiliar)', () => {
        const mockIdExistente = 'invEx1';
        const mockInventarioAtivo = { id: mockIdExistente, nome: 'Inventario Ativo', status: true };
        const mockInventarioInativo = { id: mockIdExistente, nome: 'Inventario Inativo', status: false };
        const mockIdInexistente = 'invNaoEx1';

        it('ensureInvExists (inventário existe e está ativo)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioAtivo);

            const result = await service.ensureInvExists(mockIdExistente);

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockIdExistente);
            expect(result).toEqual(mockInventarioAtivo);
            expect(CustomError).not.toHaveBeenCalled();
        });

        it('ensureInvExists (inventário existe mas está INATIVO)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioInativo);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "invalidOperation",
                field: "status",
                customMessage: "Operação não permitida em inventário inativo.",
                 details: [{
                    path: "status",
                    message: "Inventário está inativo. Não é possível alterar ou deletar."
                }],
            };

            await expect(service.ensureInvExists(mockIdExistente))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockIdExistente);
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining(expectedErrorDetails));
        });

        it('ensureInvExists (inventário não existe)', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);
            const expectedErrorDetails = {
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Inventário",
                customMessage: messages.error.resourceNotFound("Inventário"),
                details: [{
                    path: "id",
                    message: "Inventário não encontrado."
                }],
            };


            await expect(service.ensureInvExists(mockIdInexistente))
                .rejects
                .toEqual(expect.objectContaining(expectedErrorDetails));


            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockIdInexistente);
            expect(CustomError).toHaveBeenCalledWith(expect.objectContaining(expectedErrorDetails));
        });
    });
});
