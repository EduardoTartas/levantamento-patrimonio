import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import LevantamentoRepository from '@repositories/LevantamentoRepository.js';
import Levantamento from '@models/Levantamento.js';
import LevantamentoFilterBuilder from '@repositories/filters/LevantamentoFilterBuild.js';
import { CustomError, messages } from '@utils/helpers/index.js';

jest.mock('@models/Levantamento.js');
jest.mock('@repositories/filters/LevantamentoFilterBuild.js');
jest.mock('@utils/helpers/index.js');

describe('LevantamentoRepository', () => {
    let repository;
    let mockModel;
    let mockFilterBuilder;

    beforeEach(() => {
        jest.clearAllMocks();

        mockModel = {
            findById: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn(),
            paginate: jest.fn(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            save: jest.fn()
        };

        Levantamento.mockImplementation((data) => ({
            ...data,
            save: mockModel.save
        }));
        Object.assign(Levantamento, mockModel);

        mockFilterBuilder = {
            comInventario: jest.fn().mockReturnThis(),
            comEstado: jest.fn().mockReturnThis(),
            comOcioso: jest.fn().mockReturnThis(),
            comUsuario: jest.fn().mockReturnThis(),
            comTombo: jest.fn().mockReturnThis(),
            comNomeBem: jest.fn().mockReturnThis(),
            build: jest.fn().mockReturnValue({})
        };
        LevantamentoFilterBuilder.mockImplementation(() => mockFilterBuilder);

        CustomError.mockImplementation((config) => {
            const error = new Error(config.customMessage);
            Object.assign(error, config);
            return error;
        });
        
        messages.error = {
            resourceNotFound: jest.fn((resource) => `${resource} não encontrado`),
            internalServerError: jest.fn((resource) => `Erro interno do servidor`)
        };

        repository = new LevantamentoRepository();
    });

    describe('Constructor', () => {
        it('deve criar instância do LevantamentoRepository com model', () => {
            expect(repository).toBeInstanceOf(LevantamentoRepository);
            expect(repository.model).toBe(Levantamento);
        });

        it('deve lançar erro quando modelo não tem método paginate', () => {
            const invalidModel = {};
            Levantamento.paginate = undefined;

            expect(() => new LevantamentoRepository()).toThrow(
                'The Levantamento model must include the paginate method. Ensure mongoose-paginate-v2 is applied.'
            );
        });
    });

    describe('buscarPorId', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockLevantamento = {
            _id: mockId,
            inventario: { _id: '507f1f77bcf86cd799439012', nome: 'Inventário 2024' },
            salaNova: { _id: '507f1f77bcf86cd799439013', nome: 'Sala 101' },
            usuario: { _id: '507f1f77bcf86cd799439014', nome: 'João Silva' },
            estado: 'Em condições de uso'
        };

        it('deve retornar levantamento por ID com populates', async () => {
            mockModel.lean.mockResolvedValue(mockLevantamento);
            mockModel.populate.mockReturnThis();

            const resultado = await repository.buscarPorId(mockId);

            expect(mockModel.findById).toHaveBeenCalledWith(mockId);
            expect(mockModel.populate).toHaveBeenCalledWith([
                { path: 'inventario', select: 'nome _id' },
                { path: 'salaNova', select: 'nome _id' },
                { path: 'usuario', select: 'nome cpf _id' }
            ]);
            expect(mockModel.lean).toHaveBeenCalled();
            expect(resultado).toBe(mockLevantamento);
        });

        it('deve lançar erro quando levantamento não existe', async () => {
            mockModel.lean.mockResolvedValue(null);
            messages.error.resourceNotFound.mockReturnValue('Levantamento não encontrado');

            await expect(repository.buscarPorId(mockId)).rejects.toThrow();
            expect(mockModel.findById).toHaveBeenCalledWith(mockId);
            expect(CustomError).toHaveBeenCalledWith({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Levantamento',
                customMessage: 'Levantamento não encontrado'
            });
        });

        it('deve propagar erro do banco de dados', async () => {
            const dbError = new Error('Erro de conexão');
            mockModel.lean.mockRejectedValue(dbError);

            await expect(repository.buscarPorId(mockId)).rejects.toThrow('Erro de conexão');
            expect(mockModel.findById).toHaveBeenCalledWith(mockId);
        });
    });

    describe('buscarPorInventarioEBem', () => {
        it('deve buscar levantamento por inventário e bem', async () => {
            const inventarioId = '507f1f77bcf86cd799439011';
            const bemId = '507f1f77bcf86cd799439012';
            const mockLevantamento = {
                _id: '507f1f77bcf86cd799439013',
                inventario: inventarioId,
                bem: { id: bemId }
            };
            
            mockModel.findOne.mockResolvedValue(mockLevantamento);

            const resultado = await repository.buscarPorInventarioEBem(inventarioId, bemId);

            expect(mockModel.findOne).toHaveBeenCalledWith({
                inventario: inventarioId,
                'bem.id': bemId
            });
            expect(resultado).toBe(mockLevantamento);
        });

        it('deve retornar null quando não encontra levantamento', async () => {
            const inventarioId = '507f1f77bcf86cd799439011';
            const bemId = '507f1f77bcf86cd799439012';
            
            mockModel.findOne.mockResolvedValue(null);

            const resultado = await repository.buscarPorInventarioEBem(inventarioId, bemId);

            expect(mockModel.findOne).toHaveBeenCalledWith({
                inventario: inventarioId,
                'bem.id': bemId
            });
            expect(resultado).toBeNull();
        });

        it('deve propagar erro do banco de dados', async () => {
            const inventarioId = '507f1f77bcf86cd799439011';
            const bemId = '507f1f77bcf86cd799439012';
            const dbError = new Error('Erro de conexão');
            
            mockModel.findOne.mockRejectedValue(dbError);

            await expect(repository.buscarPorInventarioEBem(inventarioId, bemId)).rejects.toThrow('Erro de conexão');
        });
    });

    describe('listar', () => {
        describe('Listagem por ID', () => {
            it('deve retornar levantamento específico quando ID é fornecido', async () => {
                const mockId = '507f1f77bcf86cd799439011';
                const mockReq = { params: { id: mockId }, query: {} };
                const mockLevantamento = { _id: mockId, estado: 'Ativo' };
                
                repository.buscarPorId = jest.fn().mockResolvedValue(mockLevantamento);

                const resultado = await repository.listar(mockReq);

                expect(repository.buscarPorId).toHaveBeenCalledWith(mockId);
                expect(resultado).toBe(mockLevantamento);
                expect(mockModel.paginate).not.toHaveBeenCalled();
            });
        });

        describe('Listagem com paginação', () => {
            const mockLevantamentos = {
                docs: [
                    { _id: '507f1f77bcf86cd799439011', estado: 'Em condições de uso' },
                    { _id: '507f1f77bcf86cd799439012', estado: 'Danificado' }
                ],
                totalDocs: 2,
                totalPages: 1,
                page: 1
            };

            it('deve listar levantamentos sem filtros', async () => {
                const mockReq = { params: {}, query: {} };
                mockModel.paginate.mockResolvedValue(mockLevantamentos);

                const resultado = await repository.listar(mockReq);

                expect(LevantamentoFilterBuilder).toHaveBeenCalled();
                expect(mockFilterBuilder.comInventario).toHaveBeenCalledWith('');
                expect(mockFilterBuilder.comEstado).toHaveBeenCalledWith('');
                expect(mockFilterBuilder.comOcioso).toHaveBeenCalledWith(undefined);
                expect(mockFilterBuilder.comUsuario).toHaveBeenCalledWith('');
                expect(mockFilterBuilder.comTombo).toHaveBeenCalledWith('');
                expect(mockFilterBuilder.comNomeBem).toHaveBeenCalledWith('');
                expect(mockFilterBuilder.build).toHaveBeenCalled();
                
                expect(mockModel.paginate).toHaveBeenCalledWith({}, {
                    page: 1,
                    limit: 10,
                    populate: [
                        { path: 'inventario', select: 'nome _id' },
                        { path: 'bem', select: 'nome tombo _id' },
                        { path: 'salaNova', select: 'nome _id' },
                        { path: 'usuario', select: 'nome cpf _id' }
                    ],
                    sort: { createdAt: -1 }
                });
                expect(resultado).toBe(mockLevantamentos);
            });

            it('deve listar levantamentos com filtros aplicados', async () => {
                const mockReq = {
                    params: {},
                    query: {
                        page: '2',
                        limite: '15',
                        inventario: '507f1f77bcf86cd799439011',
                        estado: 'Em condições de uso',
                        ocioso: 'true',
                        usuario: '507f1f77bcf86cd799439012',
                        tombo: 'TOM123',
                        nomeBem: 'Mesa'
                    }
                };
                const mockFiltros = {
                    inventario: '507f1f77bcf86cd799439011',
                    estado: 'Em condições de uso',
                    ocioso: true
                };
                
                mockFilterBuilder.build.mockReturnValue(mockFiltros);
                mockModel.paginate.mockResolvedValue(mockLevantamentos);

                const resultado = await repository.listar(mockReq);

                expect(mockFilterBuilder.comInventario).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(mockFilterBuilder.comEstado).toHaveBeenCalledWith('Em condições de uso');
                expect(mockFilterBuilder.comOcioso).toHaveBeenCalledWith('true');
                expect(mockFilterBuilder.comUsuario).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
                expect(mockFilterBuilder.comTombo).toHaveBeenCalledWith('TOM123');
                expect(mockFilterBuilder.comNomeBem).toHaveBeenCalledWith('Mesa');
                
                expect(mockModel.paginate).toHaveBeenCalledWith(mockFiltros, {
                    page: 2,
                    limit: 15,
                    populate: expect.any(Array),
                    sort: { createdAt: -1 }
                });
                expect(resultado).toBe(mockLevantamentos);
            });

            it('deve aplicar limite máximo de 100 resultados por página', async () => {
                const mockReq = {
                    params: {},
                    query: { limite: '200' }
                };
                mockModel.paginate.mockResolvedValue(mockLevantamentos);

                await repository.listar(mockReq);

                expect(mockModel.paginate).toHaveBeenCalledWith(expect.any(Object), 
                    expect.objectContaining({ limit: 100 })
                );
            });

            it('deve usar valores padrão para page e limite quando não fornecidos', async () => {
                const mockReq = { params: {}, query: {} };
                mockModel.paginate.mockResolvedValue(mockLevantamentos);

                await repository.listar(mockReq);

                expect(mockModel.paginate).toHaveBeenCalledWith(expect.any(Object), 
                    expect.objectContaining({
                        page: 1,
                        limit: 10
                    })
                );
            });

            it('deve tratar page e limite inválidos', async () => {
                const mockReq = {
                    params: {},
                    query: { page: 'invalid', limite: 'invalid' }
                };
                mockModel.paginate.mockResolvedValue(mockLevantamentos);

                await repository.listar(mockReq);

                expect(mockModel.paginate).toHaveBeenCalledWith(expect.any(Object), 
                    expect.objectContaining({
                        page: 1,
                        limit: 10
                    })
                );
            });

            it('deve lançar erro quando filterBuilder não tem método build', async () => {
                const mockReq = { params: {}, query: {} };
                mockFilterBuilder.build = undefined;

                await expect(repository.listar(mockReq)).rejects.toThrow();
                expect(CustomError).toHaveBeenCalledWith({
                    statusCode: 500,
                    errorType: 'internalServerError',
                    field: 'Levantamento',
                    details: [],
                    customMessage: expect.any(String)
                });
            });

            it('deve propagar erro do banco na paginação', async () => {
                const mockReq = { params: {}, query: {} };
                const dbError = new Error('Erro de paginação');
                mockModel.paginate.mockRejectedValue(dbError);

                await expect(repository.listar(mockReq)).rejects.toThrow('Erro de paginação');
            });
        });
    });

    describe('criar', () => {
        const mockParsedData = {
            inventario: '507f1f77bcf86cd799439011',
            bemId: '507f1f77bcf86cd799439012',
            estado: 'Em condições de uso',
            ocioso: false
        };

        it('deve criar levantamento com sucesso', async () => {
            const mockCreatedLevantamento = { _id: '507f1f77bcf86cd799439013', ...mockParsedData };
            mockModel.save.mockResolvedValue(mockCreatedLevantamento);

            const resultado = await repository.criar(mockParsedData);

            expect(Levantamento).toHaveBeenCalledWith(mockParsedData);
            expect(mockModel.save).toHaveBeenCalled();
            expect(resultado).toBe(mockCreatedLevantamento);
        });

        it('deve propagar erro do banco na criação', async () => {
            const dbError = new Error('Erro de validação');
            mockModel.save.mockRejectedValue(dbError);

            await expect(repository.criar(mockParsedData)).rejects.toThrow('Erro de validação');
            expect(Levantamento).toHaveBeenCalledWith(mockParsedData);
            expect(mockModel.save).toHaveBeenCalled();
        });

        it('deve criar levantamento com dados vazios', async () => {
            const emptyData = {};
            const mockCreatedLevantamento = { _id: '507f1f77bcf86cd799439013' };
            mockModel.save.mockResolvedValue(mockCreatedLevantamento);

            const resultado = await repository.criar(emptyData);

            expect(Levantamento).toHaveBeenCalledWith(emptyData);
            expect(resultado).toBe(mockCreatedLevantamento);
        });
    });

    describe('atualizar', () => {
        const mockId = '507f1f77bcf86cd799439011';
        const mockParsedData = { estado: 'Danificado', ocioso: true };
        const mockUpdatedLevantamento = {
            _id: mockId,
            ...mockParsedData,
            inventario: { _id: '507f1f77bcf86cd799439012', nome: 'Inventário 2024' }
        };

        it('deve atualizar levantamento com sucesso', async () => {
            mockModel.populate.mockResolvedValue(mockUpdatedLevantamento);

            const resultado = await repository.atualizar(mockId, mockParsedData);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(mockId, mockParsedData, { new: true });
            expect(mockModel.populate).toHaveBeenCalledWith([
                { path: 'inventario', select: 'nome _id' },
                { path: 'bem', select: 'nome tombo _id' },
                { path: 'salaNova', select: 'nome _id' },
                { path: 'usuario', select: 'nome cpf _id' }
            ]);
            expect(resultado).toBe(mockUpdatedLevantamento);
        });

        it('deve lançar erro quando levantamento não existe para atualização', async () => {
            mockModel.populate.mockResolvedValue(null);
            messages.error.resourceNotFound.mockReturnValue('Levantamento não encontrado');

            await expect(repository.atualizar(mockId, mockParsedData)).rejects.toThrow();
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(mockId, mockParsedData, { new: true });
            expect(CustomError).toHaveBeenCalledWith({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Levantamento',
                details: [],
                customMessage: 'Levantamento não encontrado'
            });
        });

        it('deve propagar erro do banco na atualização', async () => {
            const dbError = new Error('Erro de atualização');
            mockModel.populate.mockRejectedValue(dbError);

            await expect(repository.atualizar(mockId, mockParsedData)).rejects.toThrow('Erro de atualização');
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(mockId, mockParsedData, { new: true });
        });

        it('deve atualizar com dados vazios', async () => {
            const emptyData = {};
            const mockResult = { _id: mockId };
            mockModel.populate.mockResolvedValue(mockResult);

            const resultado = await repository.atualizar(mockId, emptyData);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(mockId, emptyData, { new: true });
            expect(resultado).toBe(mockResult);
        });
    });

    describe('deletar', () => {
        const mockId = '507f1f77bcf86cd799439011';

        it('deve deletar levantamento com sucesso', async () => {
            const mockDeletedLevantamento = {
                _id: mockId,
                estado: 'Em condições de uso',
                deleted: true
            };
            mockModel.findByIdAndDelete.mockResolvedValue(mockDeletedLevantamento);

            const resultado = await repository.deletar(mockId);

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
            expect(resultado).toBe(mockDeletedLevantamento);
        });

        it('deve retornar null quando levantamento não existe para deleção', async () => {
            mockModel.findByIdAndDelete.mockResolvedValue(null);

            const resultado = await repository.deletar(mockId);

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
            expect(resultado).toBeNull();
        });

        it('deve propagar erro do banco na deleção', async () => {
            const dbError = new Error('Erro de deleção');
            mockModel.findByIdAndDelete.mockRejectedValue(dbError);

            await expect(repository.deletar(mockId)).rejects.toThrow('Erro de deleção');
            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
        });

        it('deve deletar com ID inválido', async () => {
            const invalidId = 'invalid-id';
            mockModel.findByIdAndDelete.mockResolvedValue(null);

            const resultado = await repository.deletar(invalidId);

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(invalidId);
            expect(resultado).toBeNull();
        });
    });

    describe('Integração com dependencies', () => {
        it('deve usar corretamente o LevantamentoFilterBuilder', async () => {
            const mockReq = {
                params: {},
                query: {
                    inventario: '507f1f77bcf86cd799439011',
                    estado: 'Em condições de uso'
                }
            };
            mockModel.paginate.mockResolvedValue({ docs: [] });

            await repository.listar(mockReq);

            expect(LevantamentoFilterBuilder).toHaveBeenCalled();
            expect(mockFilterBuilder.comInventario).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockFilterBuilder.comEstado).toHaveBeenCalledWith('Em condições de uso');
            expect(mockFilterBuilder.build).toHaveBeenCalled();
        });

        it('deve aplicar populates corretos em todas as operações que precisam', async () => {
            const mockId = '507f1f77bcf86cd799439011';
            const expectedPopulates = [
                { path: 'inventario', select: 'nome _id' },
                { path: 'salaNova', select: 'nome _id' },
                { path: 'usuario', select: 'nome cpf _id' }
            ];

            mockModel.lean.mockResolvedValue({ _id: mockId });
            await repository.buscarPorId(mockId);
            expect(mockModel.populate).toHaveBeenCalledWith(expectedPopulates);

            mockModel.populate.mockClear();

            const expectedPopulatesUpdate = [
                { path: 'inventario', select: 'nome _id' },
                { path: 'bem', select: 'nome tombo _id' },
                { path: 'salaNova', select: 'nome _id' },
                { path: 'usuario', select: 'nome cpf _id' }
            ];
            mockModel.populate.mockResolvedValue({ _id: mockId });
            await repository.atualizar(mockId, {});
            expect(mockModel.populate).toHaveBeenCalledWith(expectedPopulatesUpdate);
        });
    });
});
