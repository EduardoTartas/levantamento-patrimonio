//src/test/services/CampusService.test.js
import CampusService from '@services/CampusService';
import CampusRepository from '@repositories/CampusRepository.js';
import CustomError from '@utils/helpers/CustomError.js';
import { jest } from '@jest/globals';

// Mock do repositório para que o teste não dependa do banco.
jest.mock('@repositories/CampusRepository.js');

describe('CampusService', () => {
    let campusService;

    beforeAll(() => {
        CampusRepository.mockClear();// Limpa instâncias anteriores
        campusService = new CampusService();
    })

    describe('listar', () => {
        it('deve retornar a lista de campus', async () => {
            const dadosMock = [{ id: 1, nome: 'IFRO', cidade: 'Vilhena' }];
            campusService.repository.listar = jest.fn().mockResolvedValue(dadosMock);

            const resultado = await campusService.listar();
            expect(resultado).toEqual(dadosMock);
        });
    });

    describe('criar', () => {
        it('deve criar um campus novo se não existir duplicado', async () => {
            const dados = { nome: 'IFRO', cidade: 'Vilhena' };
            
            // Simula que não existe campus com o mesmo nome e cidade
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(null);
            campusService.repository.criar = jest.fn().mockResolvedValue({ id: 1, ...dados })

            const resultado = await campusService.criar(dados);
            expect(resultado).toEqual({ id: 1, ...dados })
        });

        it('deve lançar erro se ja existir campus com mesmo nome e cidade', async () => {
            const dados = { nome: 'IFRO', cidade: 'Vilhena' };

            // Simula a existência de campus duplicado
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(dados);

            // Se criar um campus duplicado, o service lança um erro esperado(CustomError)
            await expect(campusService.criar(dados)).rejects.toThrow(CustomError);
        });
    });

    describe('atualizar', () => {
        it('deve atualizar um campus existente', async () => {
            const id = 1;
            const dados = { nome: 'IFRO atualizado', cidade: 'Vilhena' };

            // Simula que não há conflito de nome e que o campus existe
            campusService.repository.buscarPorNome = jest.fn().mockResolvedValue(null);
            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.atualizar = jest.fn().mockResolvedValue({ id, ...dados });

            const resultado = await campusService.atualizar(id, dados);
            expect(resultado).toEqual({ id, ...dados });
        });
    });

    describe('deletar', () => {
        it('deve deletar um cmapus se não houver usuários associados', async () => {
            const id = 1;

            // Simula que o campus existe e não tem usuários associados
            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.verificarUsuariosAssociados = jest.fn().mockResolvedValue(false);
            campusService.repository.deletar = jest.fn().mockResolvedValue(true);

            const resultado = await campusService.deletar(id);
            expect(resultado).toBe(true);
        });

        it('deve lançar erro se houver usuários associados', async () => {
            const id = 1;

             // Simula que o campus existe, mas possui usuários vinculados
            campusService.repository.buscarPorId = jest.fn().mockResolvedValue({ id });
            campusService.repository.verificarUsuariosAssociados = jest.fn().mockResolvedValue(true);

            await expect(campusService.deletar(id)).rejects.toThrow(CustomError);
        });
    });
});