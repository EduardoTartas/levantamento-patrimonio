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
                }
            ];
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMock);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMock);
        });

        it('deve retornar dados paginados', async () => {
            const req = { 
                params: {}, 
                query: { 
                    page: '2', 
                    limite: '5' 
                } 
            };
            const dadosMockPaginados = {
                docs: [{ id: '507f1f77bcf86cd799439011', nome: 'Mesa de Reunião' }],
                totalDocs: 10,
                limit: 5,
                page: 2,
                totalPages: 2
            };
            bemService.repository.listar = jest.fn().mockResolvedValue(dadosMockPaginados);

            const resultado = await bemService.listar(req);
            
            expect(bemService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMockPaginados);
        });

        it('deve retornar lista vazia quando não há bens', async () => {
            const req = { params: {}, query: {} };
            bemService.repository.listar = jest.fn().mockResolvedValue([]);

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

        it('deve propagar erro do repositório', async () => {
            const id = '507f1f77bcf86cd799439011';
            const erroMock = new Error('Erro de conexão');
            bemService.repository.buscarPorId = jest.fn().mockRejectedValue(erroMock);

            await expect(bemService.ensureBemExists(id)).rejects.toThrow('Erro de conexão');
            expect(bemService.repository.buscarPorId).toHaveBeenCalledWith(id);
        });
    });
});
