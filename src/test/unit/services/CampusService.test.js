import CampusService from '@services/CampusService';
import CampusRepository from '@repositories/CampusRepository.js';
import CustomError from '@utils/helpers/CustomError.js';
import { jest } from '@jest/globals';

jest.mock('@repositories/CampusRepository.js');

describe('CampusService', () => {
    let campusService;

    beforeAll(() => {
        CampusRepository.mockClear();
        campusService = new CampusService();
    })

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listar', () => {
        it('deve retornar a lista de campus', async () => {
            const req = { params: {}, query: {} };
            const dadosMock = [{ id: 1, nome: 'IFRO', cidade: 'Vilhena' }];
            campusService.repository.listar = jest.fn().mockResolvedValue(dadosMock);

            const resultado = await campusService.listar(req);
            
            expect(campusService.repository.listar).toHaveBeenCalledWith(req);
            expect(resultado).toEqual(dadosMock);
        });

        it('deve retornar lista vazia quando não há campus', async () => {
            const req = { params: {}, query: {} };
            campusService.repository.listar = jest.fn().mockResolvedValue([]);

            const resultado = await campusService.listar(req);
            
            expect(resultado).toEqual([]);
        });
    });

    describe('criar', () => {
        it('deve criar um campus novo se não existir duplicado', async () => {
            const dados = { nome: 'IFRO', cidade: 'Vilhena' };
            
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(null);
            campusService.repository.criar = jest.fn().mockResolvedValue({ id: 1, ...dados });

            const resultado = await campusService.criar(dados);
            
            expect(campusService.repository.buscarPorNome).toHaveBeenCalledWith('IFRO', 'Vilhena', null);
            expect(resultado).toEqual({ id: 1, ...dados });
        });

        it('deve lançar erro se já existir campus com mesmo nome e cidade', async () => {
            const dados = { nome: 'IFRO', cidade: 'Vilhena' };

            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(dados);

            await expect(campusService.criar(dados)).rejects.toThrow(CustomError);
        });
    });

    describe('atualizar', () => {
        it('deve atualizar um campus existente', async () => {
            const id = 1;
            const dados = { nome: 'IFRO atualizado', cidade: 'Vilhena' };

            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(null);
            campusService.repository.atualizar = jest.fn().mockResolvedValue({ id, ...dados });

            const resultado = await campusService.atualizar(id, dados);
            
            expect(campusService.repository.buscarPorId).toHaveBeenCalledWith(id);
            expect(campusService.repository.buscarPorNome).toHaveBeenCalledWith('IFRO atualizado', 'Vilhena', id);
            expect(resultado).toEqual({ id, ...dados });
        });

        it('deve lançar erro se campus não existir', async () => {
            const id = 1;
            const dados = { nome: 'IFRO atualizado', cidade: 'Vilhena' };

            campusService.repository.buscarPorId = jest.fn().mockResolvedValue(null);

            await expect(campusService.atualizar(id, dados)).rejects.toThrow(CustomError);
        });
    });

    describe('deletar', () => {
        it('deve deletar um campus se não houver usuários associados', async () => {
            const id = 1;

            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.verificarUsuariosAssociados = jest.fn().mockResolvedValue(false);
            campusService.repository.deletar = jest.fn().mockResolvedValue(true);

            const resultado = await campusService.deletar(id);
            
            expect(campusService.repository.buscarPorId).toHaveBeenCalledWith(id);
            expect(campusService.repository.verificarUsuariosAssociados).toHaveBeenCalledWith(id);
            expect(resultado).toBe(true);
        });

        it('deve lançar erro se houver usuários associados', async () => {
            const id = 1;

            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.verificarUsuariosAssociados = jest.fn().mockResolvedValue(true);

            await expect(campusService.deletar(id)).rejects.toThrow(CustomError);
        });

        it('deve lançar erro se campus não existir', async () => {
            const id = 1;

            campusService.repository.buscarPorId = jest.fn().mockResolvedValue(null);

            await expect(campusService.deletar(id)).rejects.toThrow(CustomError);
        });
    });

    describe('validateNomeCidade', () => {
        it('deve passar validação se não houver campus duplicado', async () => {
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(null);

            await expect(campusService.validateNomeCidade('IFRO', 'Vilhena')).resolves.toBeUndefined();
        });

        it('deve lançar erro se houver campus duplicado', async () => {
            const campus = { id: 1, nome: 'IFRO', cidade: 'Vilhena' };
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(campus);

            await expect(campusService.validateNomeCidade('IFRO', 'Vilhena')).rejects.toThrow(CustomError);
        });
    });

    describe('ensureCampExists', () => {
        it('deve passar se campus existir', async () => {
            const id = 1;
            const campus = { id, nome: 'IFRO', cidade: 'Vilhena' };
            campusService.repository.buscarPorId = jest.fn().mockResolvedValue(campus);

            await expect(campusService.ensureCampExists(id)).resolves.toBeUndefined();
        });

        it('deve lançar erro se campus não existir', async () => {
            const id = 1;
            campusService.repository.buscarPorId = jest.fn().mockResolvedValue(null);

            await expect(campusService.ensureCampExists(id)).rejects.toThrow(CustomError);
        });
    });
});