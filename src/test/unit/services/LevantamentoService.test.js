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
jest.mock('@utils/helpers/index.js');
jest.mock('@config/minioConnect.js');

const originalEnv = process.env;
beforeEach(() => {
    process.env = {
        ...originalEnv,
        MINIO_BUCKET_FOTOS: 'test-bucket',
        MINIO_PORT: '9000'
    };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('LevantamentoService', () => {
    let service;
    let mockRepository;
    let mockInventarioService;
    let mockSalaService;
    let mockBemService;

    beforeEach(() => {
        jest.clearAllMocks();

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

        CustomError.mockImplementation((config) => {
            const error = new Error(config.customMessage);
            Object.assign(error, config);
            return error;
        });
        
        HttpStatusCodes.NOT_FOUND = { code: 404 };
        HttpStatusCodes.BAD_REQUEST = { code: 400 };
        HttpStatusCodes.INTERNAL_SERVER_ERROR = { code: 500 };
        
        messages.error = {
            resourceNotFound: jest.fn((resource) => `${resource} não encontrado`)
        };

        service = new LevantamentoService();
    });

    describe('Constructor', () => {
        it('deve criar instância do LevantamentoService com todas as dependências', () => {
            expect(service).toBeInstanceOf(LevantamentoService);
            expect(service.repository).toBeDefined();
            expect(service.inventarioService).toBeDefined();
            expect(service.bemService).toBeDefined();
            expect(service.salaService).toBeDefined();
        });
    });

    describe('listar', () => {
        it('deve listar levantamentos e gerar URLs assinadas', async () => {
            const mockReq = { query: { page: 1 } };
            const mockResultado = {
                docs: [
                    { 
                        _id: '507f1f77bcf86cd799439011',
                        imagem: ['foto1.jpg', 'foto2.jpg'],
                        imagemUrls: []
                    }
                ]
            };
            
            mockRepository.listar.mockResolvedValue(mockResultado);
            minioClient.presignedGetObject.mockResolvedValue('http://localhost:9000/test-bucket/foto1.jpg');
            
            const resultado = await service.listar(mockReq);
            
            expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(resultado).toBe(mockResultado);
        });

        it('deve retornar resultado sem gerar URLs quando não há resultado', async () => {
            const mockReq = { query: {} };
            mockRepository.listar.mockResolvedValue(null);
            
            const resultado = await service.listar(mockReq);
            
            expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
            expect(resultado).toBeNull();
            expect(minioClient.presignedGetObject).not.toHaveBeenCalled();
        });

        it('deve propagar erro do repository', async () => {
            const mockReq = { query: {} };
            const repositoryError = new Error('Erro do repository');
            mockRepository.listar.mockRejectedValue(repositoryError);
            
            await expect(service.listar(mockReq)).rejects.toThrow('Erro do repository');
            expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
        });
    });

    describe('criar', () => {
        const mockParsedData = {
            inventario: '507f1f77bcf86cd799439011',
            bemId: '507f1f77bcf86cd799439012',
            estado: 'Em condições de uso',
            ocioso: false
        };

        const mockBem = {
            id: '507f1f77bcf86cd799439012',
            tombo: 'TOM123',
            nome: 'Mesa',
            descricao: 'Mesa de escritório',
            sala: '507f1f77bcf86cd799439013',
            responsavel: {
                nome: 'João Silva',
                cpf: '123.456.789-00'
            }
        };

        it('deve criar levantamento com sucesso', async () => {
            const expectedData = {
                ...mockParsedData,
                imagem: [],
                bem: {
                    responsavel: {
                        nome: 'João Silva',
                        cpf: '123.456.789-00'
                    },
                    tombo: 'TOM123',
                    nome: 'Mesa',
                    descricao: 'Mesa de escritório',
                    salaId: '507f1f77bcf86cd799439013',
                    id: '507f1f77bcf86cd799439012'
                }
            };
            const mockCreatedLevantamento = { _id: '507f1f77bcf86cd799439014', ...expectedData };
            
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            mockBemService.ensureBemExists.mockResolvedValue(mockBem);
            mockRepository.criar.mockResolvedValue(mockCreatedLevantamento);
            
            const resultado = await service.criar(mockParsedData);
            
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockParsedData.inventario);
            expect(mockRepository.buscarPorInventarioEBem).toHaveBeenCalledWith(
                mockParsedData.inventario,
                mockParsedData.bemId
            );
            expect(mockBemService.ensureBemExists).toHaveBeenCalledWith(mockParsedData.bemId);
            expect(mockRepository.criar).toHaveBeenCalledWith(expectedData);
            expect(resultado).toBe(mockCreatedLevantamento);
        });

        it('deve criar levantamento com sala nova quando fornecida', async () => {
            const dataComSalaNova = { ...mockParsedData, salaNova: '507f1f77bcf86cd799439015' };
            const mockCreatedLevantamento = { _id: '507f1f77bcf86cd799439014' };
            
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            mockSalaService.ensureSalaExists.mockResolvedValue(true);
            mockBemService.ensureBemExists.mockResolvedValue(mockBem);
            mockRepository.criar.mockResolvedValue(mockCreatedLevantamento);
            
            await service.criar(dataComSalaNova);
            
            expect(mockSalaService.ensureSalaExists).toHaveBeenCalledWith('507f1f77bcf86cd799439015');
        });

        it('deve criar levantamento com responsável vazio quando bem não tem responsável', async () => {
            const bemSemResponsavel = { ...mockBem, responsavel: null };
            const expectedData = {
                ...mockParsedData,
                imagem: [],
                bem: {
                    responsavel: {
                        nome: '',
                        cpf: ''
                    },
                    tombo: 'TOM123',
                    nome: 'Mesa',
                    descricao: 'Mesa de escritório',
                    salaId: '507f1f77bcf86cd799439013',
                    id: '507f1f77bcf86cd799439012'
                }
            };
            
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            mockBemService.ensureBemExists.mockResolvedValue(bemSemResponsavel);
            mockRepository.criar.mockResolvedValue({});
            
            await service.criar(mockParsedData);
            
            expect(mockRepository.criar).toHaveBeenCalledWith(expectedData);
        });

        it('deve lançar erro quando inventário não existe', async () => {
            const inventarioError = new Error('Inventário não encontrado');
            mockInventarioService.ensureInvExists.mockRejectedValue(inventarioError);
            
            await expect(service.criar(mockParsedData)).rejects.toThrow('Inventário não encontrado');
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(mockParsedData.inventario);
            expect(mockRepository.buscarPorInventarioEBem).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando levantamento já existe para o bem no inventário', async () => {
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue({ _id: 'existing-id' });
            
            await expect(service.criar(mockParsedData)).rejects.toThrow();
            expect(mockRepository.buscarPorInventarioEBem).toHaveBeenCalledWith(
                mockParsedData.inventario,
                mockParsedData.bemId
            );
            expect(mockBemService.ensureBemExists).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando bem não existe', async () => {
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            
            const bemError = new Error('Bem não encontrado');
            mockBemService.ensureBemExists.mockRejectedValue(bemError);
            
            await expect(service.criar(mockParsedData)).rejects.toThrow('Bem não encontrado');
            expect(mockBemService.ensureBemExists).toHaveBeenCalledWith(mockParsedData.bemId);
        });

        it('deve propagar erro do repository na criação', async () => {
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
            mockBemService.ensureBemExists.mockResolvedValue(mockBem);
            
            const repositoryError = new Error('Erro ao criar no banco');
            mockRepository.criar.mockRejectedValue(repositoryError);
            
            await expect(service.criar(mockParsedData)).rejects.toThrow('Erro ao criar no banco');
        });
    });

    describe('atualizar', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockParsedData = { estado: 'Danificado', ocioso: true };
        const mockLevantamento = {
            _id: mockId,
            inventario: { _id: '507f1f77bcf86cd799439012' },
            estado: 'Em condições de uso'
        };

        it('deve atualizar levantamento com sucesso', async () => {
            const mockUpdatedLevantamento = { ...mockLevantamento, ...mockParsedData };
            
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue(mockUpdatedLevantamento);
            
            const resultado = await service.atualizar(mockId, mockParsedData);
            
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, mockParsedData);
            expect(resultado).toBe(mockUpdatedLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);
            
            await expect(service.atualizar(mockId, mockParsedData)).rejects.toThrow();
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            
            const inventarioError = new Error('Inventário não encontrado');
            mockInventarioService.ensureInvExists.mockRejectedValue(inventarioError);
            
            await expect(service.atualizar(mockId, mockParsedData)).rejects.toThrow('Inventário não encontrado');
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
        });

        it('deve propagar erro do repository na atualização', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            
            const repositoryError = new Error('Erro ao atualizar no banco');
            mockRepository.atualizar.mockRejectedValue(repositoryError);
            
            await expect(service.atualizar(mockId, mockParsedData)).rejects.toThrow('Erro ao atualizar no banco');
        });
    });

    describe('deletar', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockLevantamento = {
            _id: mockId,
            inventario: { _id: '507f1f77bcf86cd799439012' },
            imagem: ['foto1.jpg', 'foto2.jpg']
        };

        it('deve deletar levantamento e suas imagens com sucesso', async () => {
            const mockDeletedLevantamento = { ...mockLevantamento, deleted: true };
            
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.deletar.mockResolvedValue(mockDeletedLevantamento);
            minioClient.removeObject.mockResolvedValue(true);
            
            const resultado = await service.deletar(mockId);
            
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(mockRepository.deletar).toHaveBeenCalledWith(mockId);
            expect(resultado).toBe(mockDeletedLevantamento);
        });

        it('deve deletar levantamento sem imagens', async () => {
            const levantamentoSemImagens = { ...mockLevantamento, imagem: [] };
            const mockDeletedLevantamento = { ...levantamentoSemImagens, deleted: true };
            
            mockRepository.buscarPorId.mockResolvedValue(levantamentoSemImagens);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            mockRepository.deletar.mockResolvedValue(mockDeletedLevantamento);
            
            const resultado = await service.deletar(mockId);
            
            expect(mockRepository.deletar).toHaveBeenCalledWith(mockId);
            expect(minioClient.removeObject).not.toHaveBeenCalled();
            expect(resultado).toBe(mockDeletedLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);
            
            await expect(service.deletar(mockId)).rejects.toThrow();
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockRepository.deletar).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            
            const inventarioError = new Error('Inventário não encontrado');
            mockInventarioService.ensureInvExists.mockRejectedValue(inventarioError);
            
            await expect(service.deletar(mockId)).rejects.toThrow('Inventário não encontrado');
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
        });

        it('deve propagar erro do repository na deleção', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            
            const repositoryError = new Error('Erro ao deletar no banco');
            mockRepository.deletar.mockRejectedValue(repositoryError);
            
            await expect(service.deletar(mockId)).rejects.toThrow('Erro ao deletar no banco');
        });
    });

    describe('adicionarFoto', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockFile = {
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake image data'),
            size: 1024
        };
        const mockLevantamento = {
            _id: mockId,
            inventario: { _id: '507f1f77bcf86cd799439012' },
            imagem: ['foto1.jpg']
        };

        it('deve adicionar foto com sucesso', async () => {
            const mockImagemInfo = {
                bucket: 'test-bucket',
                fileName: `${mockId}-test.jpg`,
                originalName: 'test.jpg',
                size: 1024,
                mimetype: 'image/jpeg'
            };
            const mockUpdatedLevantamento = {
                ...mockLevantamento,
                imagem: ['foto1.jpg', `${mockId}-test.jpg`],
                imagemUrls: []
            };
            
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            minioClient.putObject.mockResolvedValue('success');
            mockRepository.atualizar.mockResolvedValue(mockUpdatedLevantamento);
            minioClient.presignedGetObject.mockResolvedValue('http://localhost:9000/test-bucket/foto.jpg');
            
            const resultado = await service.adicionarFoto(mockId, mockFile);
            
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(minioClient.putObject).toHaveBeenCalledWith(
                'test-bucket',
                `${mockId}-test.jpg`,
                mockFile.buffer,
                mockFile.size,
                { 'Content-Type': 'image/jpeg' }
            );
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, {
                imagem: ['foto1.jpg', `${mockId}-test.jpg`]
            });
            expect(resultado).toBe(mockUpdatedLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);
            
            await expect(service.adicionarFoto(mockId, mockFile)).rejects.toThrow();
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(minioClient.putObject).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando inventário não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            
            const inventarioError = new Error('Inventário não encontrado');
            mockInventarioService.ensureInvExists.mockRejectedValue(inventarioError);
            
            await expect(service.adicionarFoto(mockId, mockFile)).rejects.toThrow('Inventário não encontrado');
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
        });

        it('deve lançar erro quando falha upload no MinIO', async () => {
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            minioClient.putObject.mockResolvedValue(null);
            
            await expect(service.adicionarFoto(mockId, mockFile)).rejects.toThrow();
            expect(minioClient.putObject).toHaveBeenCalled();
            expect(mockRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    describe('deletarFoto', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockLevantamento = {
            _id: mockId,
            inventario: { _id: '507f1f77bcf86cd799439012' },
            imagem: ['foto1.jpg', 'foto2.jpg']
        };

        it('deve deletar fotos com sucesso', async () => {
            const mockUpdatedLevantamento = { ...mockLevantamento, imagem: [] };
            
            mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            minioClient.removeObject.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue(mockUpdatedLevantamento);
            
            const resultado = await service.deletarFoto(mockId);
            
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(minioClient.removeObject).toHaveBeenCalledTimes(2);
            expect(mockRepository.atualizar).toHaveBeenCalledWith(mockId, { imagem: [] });
            expect(resultado).toBe(mockUpdatedLevantamento);
        });

        it('deve lançar erro quando levantamento não tem imagens', async () => {
            const levantamentoSemImagens = { ...mockLevantamento, imagem: [] };
            mockRepository.buscarPorId.mockResolvedValue(levantamentoSemImagens);
            mockInventarioService.ensureInvExists.mockResolvedValue(true);
            
            await expect(service.deletarFoto(mockId)).rejects.toThrow();
            expect(minioClient.removeObject).not.toHaveBeenCalled();
            expect(mockRepository.atualizar).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);
            
            await expect(service.deletarFoto(mockId)).rejects.toThrow();
            expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
            expect(minioClient.removeObject).not.toHaveBeenCalled();
        });
    });

    describe('Métodos auxiliares', () => {
        describe('enviarMinio', () => {
            const mockId = '507f1f77bcf86cd799439011';
            const mockFile = {
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('fake image data'),
                size: 1024
            };

            it('deve enviar arquivo para MinIO com sucesso', async () => {
                minioClient.putObject.mockResolvedValue('upload-etag');
                
                const resultado = await service.enviarMinio(mockId, mockFile);
                
                expect(minioClient.putObject).toHaveBeenCalledWith(
                    'test-bucket',
                    `${mockId}-test.jpg`,
                    mockFile.buffer,
                    mockFile.size,
                    { 'Content-Type': 'image/jpeg' }
                );
                expect(resultado).toEqual({
                    bucket: 'test-bucket',
                    fileName: `${mockId}-test.jpg`,
                    originalName: 'test.jpg',
                    size: 1024,
                    mimetype: 'image/jpeg'
                });
            });

            it('deve lançar erro quando upload falha', async () => {
                minioClient.putObject.mockResolvedValue(null);
                
                await expect(service.enviarMinio(mockId, mockFile)).rejects.toThrow();
                expect(minioClient.putObject).toHaveBeenCalled();
            });
        });

        describe('deletarMinio', () => {
            it('deve deletar arquivo do MinIO com sucesso', async () => {
                const fileName = 'test-file.jpg';
                minioClient.removeObject.mockResolvedValue(true);
                
                const resultado = await service.deletarMinio(fileName);
                
                expect(minioClient.removeObject).toHaveBeenCalledWith('test-bucket', fileName);
                expect(resultado).toBe(true);
            });

            it('deve lançar erro quando deleção falha', async () => {
                const fileName = 'test-file.jpg';
                const minioError = new Error('Arquivo não encontrado');
                minioClient.removeObject.mockRejectedValue(minioError);
                
                await expect(service.deletarMinio(fileName)).rejects.toThrow();
                expect(minioClient.removeObject).toHaveBeenCalledWith('test-bucket', fileName);
            });
        });

        describe('gerarUrlsAssinadas', () => {
            beforeEach(() => {
                minioClient.host = 'minio';
                minioClient.port = 9000;
            });

            it('deve gerar URLs assinadas com sucesso', async () => {
                const mockDoc = {
                    _id: '507f1f77bcf86cd799439011',
                    imagem: ['foto1.jpg', 'foto2.jpg']
                };
                minioClient.presignedGetObject.mockResolvedValue('http://localhost:9000/test-bucket/foto.jpg');
                
                const resultado = await service.gerarUrlsAssinadas(mockDoc);
                
                expect(minioClient.presignedGetObject).toHaveBeenCalledTimes(2);
                expect(resultado.imagemUrls).toHaveLength(2);
                expect(minioClient.host).toBe('minio');
                expect(minioClient.port).toBe(9000);
            });

            it('deve retornar array vazio quando não há imagens', async () => {
                const mockDoc = {
                    _id: '507f1f77bcf86cd799439011',
                    imagem: []
                };
                
                const resultado = await service.gerarUrlsAssinadas(mockDoc);
                
                expect(resultado.imagemUrls).toEqual([]);
                expect(minioClient.presignedGetObject).not.toHaveBeenCalled();
            });

            it('deve retornar doc com imagemUrls vazio quando doc é null', async () => {
                const resultado = await service.gerarUrlsAssinadas(null);
                
                expect(resultado).toBeNull();
                expect(minioClient.presignedGetObject).not.toHaveBeenCalled();
            });

            it('deve tratar erro na geração de URLs e restaurar configurações MinIO', async () => {
                const mockDoc = {
                    _id: '507f1f77bcf86cd799439011',
                    imagem: ['foto1.jpg']
                };
                const presignedError = new Error('Erro ao gerar URL');
                minioClient.presignedGetObject.mockRejectedValue(presignedError);
                
                const resultado = await service.gerarUrlsAssinadas(mockDoc);
                
                expect(resultado.imagemUrls).toEqual([]);
                expect(minioClient.host).toBe('minio');
                expect(minioClient.port).toBe(9000);
            });
        });

        describe('ensureLevantamentoExists', () => {
            it('deve retornar levantamento quando existe', async () => {
                const mockId = '507f1f77bcf86cd799439011';
                const mockLevantamento = { _id: mockId, estado: 'Ativo' };
                mockRepository.buscarPorId.mockResolvedValue(mockLevantamento);
                
                const resultado = await service.ensureLevantamentoExists(mockId);
                
                expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
                expect(resultado).toBe(mockLevantamento);
            });

            it('deve lançar erro quando levantamento não existe', async () => {
                const mockId = '507f1f77bcf86cd799439011';
                mockRepository.buscarPorId.mockResolvedValue(null);
                messages.error.resourceNotFound.mockReturnValue('Levantamento não encontrado');
                
                await expect(service.ensureLevantamentoExists(mockId)).rejects.toThrow();
                expect(mockRepository.buscarPorId).toHaveBeenCalledWith(mockId);
                expect(messages.error.resourceNotFound).toHaveBeenCalledWith('Levantamento');
            });
        });

        describe('ensureLevantamentoUnico', () => {
            it('deve passar quando não existe levantamento para o bem no inventário', async () => {
                const inventarioId = '507f1f77bcf86cd799439011';
                const bemId = '507f1f77bcf86cd799439012';
                mockRepository.buscarPorInventarioEBem.mockResolvedValue(null);
                
                await service.ensureLevantamentoUnico(inventarioId, bemId);
                
                expect(mockRepository.buscarPorInventarioEBem).toHaveBeenCalledWith(inventarioId, bemId);
            });

            it('deve lançar erro quando já existe levantamento para o bem no inventário', async () => {
                const inventarioId = '507f1f77bcf86cd799439011';
                const bemId = '507f1f77bcf86cd799439012';
                const mockLevantamentoExistente = { _id: '507f1f77bcf86cd799439013' };
                mockRepository.buscarPorInventarioEBem.mockResolvedValue(mockLevantamentoExistente);
                
                await expect(service.ensureLevantamentoUnico(inventarioId, bemId)).rejects.toThrow();
                expect(mockRepository.buscarPorInventarioEBem).toHaveBeenCalledWith(inventarioId, bemId);
            });
        });
    });
});
