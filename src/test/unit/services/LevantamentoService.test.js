import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import LevantamentoService from '@services/LevantamentoService.js';
import LevantamentoRepository from '@repositories/LevantamentoRepository.js';
import InventarioService from '@services/InventarioService.js';
import SalaService from '@services/SalaService.js';
import BemService from '@services/BemService.js';
import { CustomError, HttpStatusCodes, messages } from '@utils/helpers/index.js';
import minioClient from '@config/minioConnect.js';

jest.mock('@repositories/LevantamentoRepository.js');
jest.mock('@services/InventarioService.js');
jest.mock('@services/SalaService.js');
jest.mock('@services/BemService.js');
jest.mock('@utils/helpers/index.js', () => {
    const originalModule = jest.requireActual('@utils/helpers/index.js');
    
    class MockCustomError extends Error {
        constructor(config) {
            super(config.customMessage || 'Custom Error');
            this.name = 'CustomError';
            this.statusCode = config.statusCode;
            this.errorType = config.errorType;
            this.field = config.field;
            this.details = config.details;
            this.customMessage = config.customMessage;
        }
    }
    
    return {
        ...originalModule,
        CustomError: MockCustomError,
        HttpStatusCodes: {
            NOT_FOUND: { code: 404 },
            BAD_REQUEST: { code: 400 },
            INTERNAL_SERVER_ERROR: { code: 500 }
        },
        messages: {
            error: {
                resourceNotFound: jest.fn((resource) => `${resource} não encontrado`)
            }
        }
    };
});
jest.mock('@config/minioConnect.js');

describe('LevantamentoService', () => {
    let service;
    let mockRepository;
    let mockInventarioService;
    let mockSalaService;
    let mockBemService;

    beforeEach(() => {
        jest.clearAllMocks();

        process.env.MINIO_BUCKET_FOTOS = 'test-bucket';
        process.env.MINIO_PORT = '9000';

        mockRepository = {
            listar: jest.fn(),
            criar: jest.fn(),
            atualizar: jest.fn(),
            deletar: jest.fn(),
            buscarPorId: jest.fn(),
            buscarPorInventarioEBem: jest.fn()
        };
        LevantamentoRepository.mockImplementation(() => mockRepository);

        mockInventarioService = {
            ensureInvExists: jest.fn()
        };
        InventarioService.mockImplementation(() => mockInventarioService);

        mockSalaService = {
            ensureSalaExists: jest.fn()
        };
        SalaService.mockImplementation(() => mockSalaService);

        mockBemService = {
            ensureBemExists: jest.fn()
        };
        BemService.mockImplementation(() => mockBemService);

        minioClient.putObject = jest.fn();
        minioClient.removeObject = jest.fn();
        minioClient.presignedGetObject = jest.fn();
        minioClient.host = 'minio';
        minioClient.port = 9000;

        service = new LevantamentoService();
    });

    describe('listar', () => {
        it('deve listar levantamentos e gerar URLs assinadas', async () => {
            const mockReq = { query: { page: 1 } };
            const mockResult = {
                docs: [{ id: '1', imagem: ['foto1.jpg'] }],
                totalDocs: 1
            };
            
            mockRepository.listar.mockResolvedValue(mockResult);
            minioClient.presignedGetObject.mockResolvedValue('http://localhost:9000/test-bucket/foto1.jpg');

            const resultado = await service.listar(mockReq);

            expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(resultado).toEqual(mockResult);
        });

        it('deve retornar resultado vazio sem gerar URLs quando não há dados', async () => {
            const mockReq = { query: { page: 1 } };
            mockRepository.listar.mockResolvedValue(null);

            const resultado = await service.listar(mockReq);

            expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(resultado).toBe(null);
        });
    });

    describe('criar', () => {
        const mockParsedData = {
            inventario: 'inv123',
            bemId: 'bem123',
            salaNova: 'sala123',
            status: 'encontrado'
        };

        const mockBem = {
            id: 'bem123',
            tombo: 'TOM123',
            nome: 'Mesa',
            descricao: 'Mesa de escritório',
            sala: 'sala123',
            responsavel: {
                nome: 'João Silva',
                cpf: '12345678901'
            }
        };

        it('deve criar levantamento quando todas as validações passam', async () => {
            const mockLevantamentoCriado = { id: 'lev123', ...mockParsedData };

            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            mockSalaService.ensureSalaExists.mockResolvedValue(true);
            mockBemService.ensureBemExists.mockResolvedValue(mockBem);
            mockRepository.criar.mockResolvedValue(mockLevantamentoCriado);

            const resultado = await service.criar(mockParsedData);

            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockParsedData.inventario);
            expect(mockRepository.buscarPorInventarioEBem).toHaveBeenCalledWith(mockParsedData.inventario, mockParsedData.bemId);
            expect(mockSalaService.ensureSalaExists).toHaveBeenCalledWith(mockParsedData.salaNova);
            expect(mockBemService.ensureBemExists).toHaveBeenCalledWith(mockParsedData.bemId);
            expect(mockRepository.criar).toHaveBeenCalledWith(expect.objectContaining({
                imagem: [],
                bem: expect.objectContaining({
                    responsavel: mockBem.responsavel,
                    tombo: mockBem.tombo,
                    nome: mockBem.nome,
                    descricao: mockBem.descricao,
                    salaId: mockBem.sala,
                    id: mockBem.id
                })
            }));
            expect(resultado).toEqual(mockLevantamentoCriado);
        });

        it('deve lançar erro quando levantamento já existe para o bem no inventário', async () => {
            const mockLevantamentoExistente = { id: 'lev456' };

            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(mockLevantamentoExistente);

            await expect(service.criar(mockParsedData)).rejects.toThrow(CustomError);
            expect(mockRepository.criar).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário não existe', async () => {
            const mockError = new CustomError({ customMessage: 'Inventário não encontrado' });
            mockInventarioService.ensureInvExists.mockRejectedValue(mockError);

            await expect(service.criar(mockParsedData)).rejects.toThrow(mockError);
        });
    });

    describe('atualizar', () => {
        const mockId = 'lev123';
        const mockParsedData = { status: 'nao_encontrado' };
        const mockLevantamento = {
            id: mockId,
            inventario: { _id: 'inv123' },
            status: 'encontrado'
        };

        it('deve atualizar levantamento quando existe', async () => {
            const mockLevantamentoAtualizado = { ...mockLevantamento, ...mockParsedData };

            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue(mockLevantamentoAtualizado);

            const resultado = await service.atualizar(mockId, mockParsedData);

            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockLevantamento.inventario._id);
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, mockParsedData);
            expect(resultado).toEqual(mockLevantamentoAtualizado);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.atualizar(mockId, mockParsedData)).rejects.toThrow(CustomError);
            expect(mockRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    describe('deletar', () => {
        const mockId = 'lev123';
        const mockLevantamento = {
            id: mockId,
            inventario: { _id: 'inv123' },
            imagem: ['foto1.jpg', 'foto2.jpg']
        };

        it('deve deletar levantamento e suas imagens', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.deletar.mockResolvedValue(mockLevantamento);
            minioClient.removeObject.mockResolvedValue(true);

            const resultado = await service.deletar(mockId);

            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockLevantamento.inventario._id);
            expect(mockRepository.deletar).toHaveBeenCalledWith(mockId);
            expect(minioClient.removeObject).toHaveBeenCalledTimes(2);
            expect(resultado).toEqual(mockLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.deletar(mockId)).rejects.toThrow(CustomError);
            expect(mockRepository.deletar).not.toHaveBeenCalled();
        });
    });

    describe('adicionarFoto', () => {
        const mockId = 'lev123';
        const mockFile = {
            originalname: 'foto.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
            size: 1024
        };
        const mockLevantamento = {
            id: mockId,
            inventario: { _id: 'inv123' },
            imagem: []
        };

        it('deve adicionar foto ao levantamento', async () => {
            const mockLevantamentoAtualizado = {
                ...mockLevantamento,
                imagem: ['lev123-foto.jpg']
            };

            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            minioClient.putObject.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue(mockLevantamentoAtualizado);
            minioClient.presignedGetObject.mockResolvedValue('http://localhost:9000/test-bucket/lev123-foto.jpg');

            const resultado = await service.adicionarFoto(mockId, mockFile);

            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockLevantamento.inventario._id);
            expect(minioClient.putObject).toHaveBeenCalledWith(
                'test-bucket',
                'lev123-foto.jpg',
                mockFile.buffer,
                mockFile.size,
                { 'Content-Type': mockFile.mimetype }
            );
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, {
                imagem: ['lev123-foto.jpg']
            });
            expect(resultado).toEqual(mockLevantamentoAtualizado);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.adicionarFoto(mockId, mockFile)).rejects.toThrow(CustomError);
            expect(minioClient.putObject).not.toHaveBeenCalled();
        });
    });

    describe('deletarFoto', () => {
        const mockId = 'lev123';
        const mockLevantamento = {
            id: mockId,
            inventario: { _id: 'inv123' },
            imagem: ['foto1.jpg', 'foto2.jpg']
        };

        it('deve deletar todas as fotos do levantamento', async () => {
            const mockLevantamentoAtualizado = {
                ...mockLevantamento,
                imagem: []
            };

            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            minioClient.removeObject.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue(mockLevantamentoAtualizado);

            const resultado = await service.deletarFoto(mockId);

            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockLevantamento.inventario._id);
            expect(minioClient.removeObject).toHaveBeenCalledTimes(2);
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, {
                imagem: []
            });
            expect(resultado).toEqual(mockLevantamentoAtualizado);
        });

        it('deve lançar erro quando não há imagens para deletar', async () => {
            const mockLevantamentoSemImagens = {
                ...mockLevantamento,
                imagem: []
            };

            mockRepository.buscarPorId.mockResolvedValue(mockLevantamentoSemImagens);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);

            await expect(service.deletarFoto(mockId)).rejects.toThrow(CustomError);
            expect(minioClient.removeObject).not.toHaveBeenCalled();
        });
    });

    describe('ensureLevantamentoExists', () => {
        const mockId = 'lev123';
        const mockLevantamento = { id: mockId, status: 'encontrado' };

        it('deve retornar levantamento quando existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);

            const resultado = await service.ensureLevantamentoExists(mockId);

            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(resultado).toEqual(mockLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);

            await expect(service.ensureLevantamentoExists(mockId)).rejects.toThrow(CustomError);
        });
    });

    describe('ensureLevantamentoUnico', () => {
        const mockInventarioId = 'inv123';
        const mockBemId = 'bem123';

        it('deve passar quando levantamento não existe', async () => {
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);

            await expect(service.ensureLevantamentoUnico(mockInventarioId, mockBemId)).resolves.toBeUndefined();
        });

        it('deve lançar erro quando levantamento já existe', async () => {
            const mockLevantamentoExistente = { id: 'lev456' };
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(mockLevantamentoExistente);

            await expect(service.ensureLevantamentoUnico(mockInventarioId, mockBemId)).rejects.toThrow(CustomError);
        });
    });
});
