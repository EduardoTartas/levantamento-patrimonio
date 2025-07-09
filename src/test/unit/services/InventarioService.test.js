import InventarioService from '@services/InventarioService';
import InventarioRepository from '@repositories/InventarioRepository';
import CampusService from '@services/CampusService';
import { CustomError, HttpStatusCodes, messages } from '@utils/helpers/index';

jest.mock('@repositories/InventarioRepository');
jest.mock('@services/CampusService');
jest.mock('@utils/helpers/index', () => {
    const originalModule = jest.requireActual('@utils/helpers/index');
    
    class MockCustomError extends Error {
        constructor(args) {
            super(args.customMessage || 'Custom Error');
            this.name = 'CustomError';
            this.statusCode = args.statusCode;
            this.errorType = args.errorType;
            this.field = args.field;
            this.details = args.details;
            this.customMessage = args.customMessage;
        }
    }
    
    return {
        ...originalModule,
        CustomError: MockCustomError,
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

        service = new InventarioService();
        mockInventarioRepository = InventarioRepository.mock.instances[0];
        mockCampusService = CampusService.mock.instances[0];

        mockReq = { params: {}, query: {}, body: {} };
    });

    describe('listar', () => {
        it('deve retornar lista de inventários', async () => {
            const mockResponseData = [{ id: '1', nome: 'Inventario 1' }];
            mockInventarioRepository.listar.mockResolvedValue(mockResponseData);

            const result = await service.listar(mockReq);

            expect(mockInventarioRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(result).toEqual(mockResponseData);
        });

        it('deve propagar erro do repositório', async () => {
            const mockError = new Error('Erro no repositório');
            mockInventarioRepository.listar.mockRejectedValue(mockError);

            await expect(service.listar(mockReq)).rejects.toThrow(mockError);
        });
    });

    describe('criar', () => {
        const mockParsedData = {
            nome: 'Novo Inventario',
            campus: 'campusId123',
        };

        it('deve criar inventário quando campus existe', async () => {
            const mockInventarioCriado = { id: 'invNew', ...mockParsedData };
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.criar.mockResolvedValue(mockInventarioCriado);

            const result = await service.criar(mockParsedData);

            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockParsedData.campus);
            expect(mockInventarioRepository.criar).toHaveBeenCalledWith(mockParsedData);
            expect(result).toEqual(mockInventarioCriado);
        });

        it('deve lançar erro quando campus não existe', async () => {
            const mockCampusError = new Error('Campus não existe');
            mockCampusService.ensureCampExists.mockRejectedValue(mockCampusError);

            await expect(service.criar(mockParsedData)).rejects.toThrow(mockCampusError);
            expect(mockInventarioRepository.criar).not.toHaveBeenCalled();
        });

        it('deve propagar erro do repositório', async () => {
            const mockRepoError = new Error('Erro no repositório');
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.criar.mockRejectedValue(mockRepoError);

            await expect(service.criar(mockParsedData)).rejects.toThrow(mockRepoError);
        });
    });

    describe('atualizar', () => {
        const mockId = 'invExistente123';
        const mockInventarioExistenteAtivo = { id: mockId, nome: 'Antigo', status: true };
        const mockUpdateData = { nome: 'Inventario Atualizado' };

        it('deve atualizar inventário existente ativo', async () => {
            const mockInventarioAtualizado = { id: mockId, ...mockUpdateData };
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.atualizar.mockResolvedValue(mockInventarioAtualizado);

            const result = await service.atualizar(mockId, mockUpdateData);

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.atualizar).toHaveBeenCalledWith(mockId, mockUpdateData);
            expect(result).toEqual(mockInventarioAtualizado);
        });

        it('deve atualizar inventário com novo campus', async () => {
            const mockUpdateDataComCampus = { nome: 'Inventario Att', campus: 'campusIdNovo456' };
            const mockInventarioAttComCampus = { id: mockId, ...mockUpdateDataComCampus };

            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockInventarioRepository.atualizar.mockResolvedValue(mockInventarioAttComCampus);

            const result = await service.atualizar(mockId, mockUpdateDataComCampus);

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(mockUpdateDataComCampus.campus);
            expect(mockInventarioRepository.atualizar).toHaveBeenCalledWith(mockId, mockUpdateDataComCampus);
            expect(result).toEqual(mockInventarioAttComCampus);
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.atualizar(mockId, mockUpdateData)).rejects.toThrow(CustomError);
            expect(mockInventarioRepository.atualizar).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário está inativo', async () => {
            const mockInventarioInativo = { id: mockId, nome: 'Inativo', status: false };
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioInativo);

            await expect(service.atualizar(mockId, mockUpdateData)).rejects.toThrow(CustomError);
            expect(mockInventarioRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    describe('deletar', () => {
        const mockId = 'invExistente123';
        const mockInventarioExistenteAtivo = { id: mockId, nome: 'Inventario', status: true };

        it('deve deletar inventário existente ativo', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioExistenteAtivo);
            mockInventarioRepository.deletar.mockResolvedValue(true);

            const result = await service.deletar(mockId);

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioRepository.deletar).toHaveBeenCalledWith(mockId);
            expect(result).toBe(true);
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.deletar(mockId)).rejects.toThrow(CustomError);
            expect(mockInventarioRepository.deletar).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário está inativo', async () => {
            const mockInventarioInativo = { id: mockId, nome: 'Inativo', status: false };
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioInativo);

            await expect(service.deletar(mockId)).rejects.toThrow(CustomError);
            expect(mockInventarioRepository.deletar).not.toHaveBeenCalled();
        });
    });

    describe('ensureInvExists', () => {
        const mockIdExistente = 'invExistente123';
        const mockInventarioAtivo = { id: mockIdExistente, nome: 'Inventario Ativo', status: true };
        const mockInventarioInativo = { id: mockIdExistente, nome: 'Inventario Inativo', status: false };

        it('deve retornar inventário quando existe e está ativo', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioAtivo);

            const result = await service.ensureInvExists(mockIdExistente);

            expect(mockInventarioRepository.buscarPorId).toHaveBeenCalledWith(mockIdExistente);
            expect(result).toEqual(mockInventarioAtivo);
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.ensureInvExists(mockIdExistente)).rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando inventário está inativo', async () => {
            mockInventarioRepository.buscarPorId.mockResolvedValue(mockInventarioInativo);

            await expect(service.ensureInvExists(mockIdExistente)).rejects.toThrow(CustomError);
        });
    });
});
