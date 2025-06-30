import BemService from '@services/BemService';
import BemRepository from '@repositories/BemRepository.js';
import { jest } from '@jest/globals';

jest.mock('@repositories/BemRepository.js');

describe('BemService', () => {
    let bemService;

    beforeAll(() => {
        BemRepository.mockClear();
        bemService = new BemService();
    })

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listar', () => {
        it('deve retornar a lista de bens', async () => {
            const req = { params: {}, query: {} };
            const dadosMock = [
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
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMock);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMock);
        });

        it('deve retornar dados paginados quando fornecido parâmetros de paginação', async () => {
            const req = { 
                params: {}, 
                query: { 
                    page: '2', 
                    limite: '5', 
                    nome: 'Mesa' 
                } 
            };
            const dadosMockPaginados = {
                docs: [
                    { 
                        id: '507f1f77bcf86cd799439011', 
                        nome: 'Mesa de Reunião',
                        valor: 350.00,
                        auditado: false 
                    }
                ],
                totalDocs: 10,
                limit: 5,
                page: 2,
                totalPages: 2,
                hasNextPage: false,
                hasPrevPage: true
            };
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMockPaginados);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMockPaginados);
            expect(resultado.docs).toHaveLength(1);
            expect(resultado.page).toBe(2);
            expect(resultado.limit).toBe(5);
        });

        it('deve retornar bem específico quando fornecido ID', async () => {
            const req = { 
                params: { id: '507f1f77bcf86cd799439011' }, 
                query: {} 
            };
            const bemMock = { 
                id: '507f1f77bcf86cd799439011', 
                nome: 'Mesa Específica',
                tombo: 'TOM123',
                responsavel: {
                    nome: 'João da Silva',
                    cpf: '12345678909'
                },
                sala: {
                    _id: '507f1f77bcf86cd799439013',
                    nome: 'Sala A101'
                },
                valor: 275.50,
                auditado: true 
            };
            bemService.repository.listar = jest.fn().mockResolvedValue(bemMock);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(bemMock);
            expect(resultado.sala).toBeDefined();
            expect(resultado.sala.nome).toBe('Sala A101');
        });

        it('deve retornar lista vazia quando não há bens', async () => {
            const req = { params: {}, query: {} };
            const dadosMockVazio = [];
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMockVazio);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual([]);
        });

        it('deve propagar erro do repositório', async () => {
            const req = { params: {}, query: {} };
            const erroMock = new Error('Erro no banco de dados');
            bemService.repository.listar = jest.fn().mockRejectedValue(erroMock);

            await expect(bemService.listar(req)).rejects.toThrow('Erro no banco de dados');
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
        });

        it('deve listar bens com filtros específicos', async () => {
            const req = { 
                params: {}, 
                query: { 
                    nome: 'Mesa',
                    tombo: 'TOM123',
                    auditado: 'true',
                    sala: 'A101'
                } 
            };
            const dadosMockFiltrados = [
                { 
                    id: '507f1f77bcf86cd799439011', 
                    nome: 'Mesa de Reunião',
                    tombo: 'TOM123456',
                    auditado: true,
                    sala: {
                        _id: '507f1f77bcf86cd799439013',
                        nome: 'Sala A101'
                    }
                }
            ];
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMockFiltrados);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMockFiltrados);
        });
    });

    describe('ensureBemExists', () => {
        it('deve retornar o bem se ele existir', async () => {
            const id = '507f1f77bcf86cd799439011';
            const bemMock = { 
                id, 
                nome: 'Mesa Existente',
                valor: 250.50 
            };
            bemService.repository.buscarPorId = jest.fn().mockResolvedValue(bemMock);

            const resultado = await bemService.ensureBemExists(id);
            
            expect(bemService.repository.buscarPorId).toHaveBeenCalledWith(id);
            expect(resultado).toEqual(bemMock);
        });

        it('deve lançar erro se o bem não existir', async () => {
            const id = '507f1f77bcf86cd799439011';
            bemService.repository.buscarPorId = jest.fn().mockResolvedValue(null);
            
            await expect(bemService.ensureBemExists(id)).rejects.toThrow();
            expect(bemService.repository.buscarPorId).toHaveBeenCalledWith(id);
        });

        it('deve propagar erro do repositório na buscarPorId', async () => {
            const id = '507f1f77bcf86cd799439011';
            const erroMock = new Error('Erro de conexão');
            bemService.repository.buscarPorId = jest.fn().mockRejectedValue(erroMock);

            await expect(bemService.ensureBemExists(id)).rejects.toThrow('Erro de conexão');
            expect(bemService.repository.buscarPorId).toHaveBeenCalledWith(id);
        });
    });

    describe('Integração entre métodos', () => {
        it('deve poder usar ensureBemExists após listar para verificar existência', async () => {
            const id = '507f1f77bcf86cd799439011';
            const bemMock = { 
                id, 
                nome: 'Mesa de Escritório',
                valor: 250.50 
            };
            
            // Mock para listar retornar o bem
            const reqListar = { params: { id }, query: {} };
            bemService.repository.listar = jest.fn().mockResolvedValue(bemMock);
            
            // Mock para ensureBemExists confirmar existência
            bemService.repository.buscarPorId = jest.fn().mockResolvedValue(bemMock);

            // Primeiro lista o bem
            const resultadoListar = await bemService.listar(reqListar);
            expect(resultadoListar).toEqual(bemMock);

            // Depois verifica se existe
            const resultadoEnsure = await bemService.ensureBemExists(id);
            expect(resultadoEnsure).toEqual(bemMock);

            expect(bemService.repository.listar).toHaveBeenCalledWith(reqListar);
            expect(bemService.repository.buscarPorId).toHaveBeenCalledWith(id);
        });
    });
});
