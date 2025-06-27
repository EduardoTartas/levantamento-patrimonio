import SalaService from '@services/SalaService.js';
import SalaRepository from '@repositories/SalaRepository.js';
import { CustomError } from '@utils/helpers/CustomError.js';
import messages from '@utils/helpers/messages.js';

describe('SalaService', () => {
  let service;
  let repository;

  beforeEach(() => {
    repository = new SalaRepository();
    service = new SalaService();
    service.repository = repository;
  });

  describe('listar', () => {
    test('deve retornar resultado do repository.listar', async () => {
      const mockResultado = [{ id: '1', nome: 'Sala A' }];
      jest.spyOn(repository, 'listar').mockResolvedValue(mockResultado);

      const resultado = await service.listar({});
      expect(resultado).toEqual(mockResultado);
      expect(repository.listar).toHaveBeenCalled();
    });
  });

  describe('ensureSalaExists', () => {
    test('deve retornar sala se ela existir', async () => {
      // Mock para simular sala existente
      const salaMock = { id: '123', nome: 'Sala Teste' };
      jest.spyOn(repository, 'buscarPorId').mockResolvedValue(salaMock);

      const resultado = await service.ensureSalaExists('123');

      expect(resultado).toBeDefined();
      expect(resultado).toEqual(salaMock);
      expect(repository.buscarPorId).toHaveBeenCalledWith('123');
    });

    test('deve lançar CustomError se sala não existir', async () => {
      // Mock para simular sala inexistente
      jest.spyOn(repository, 'buscarPorId').mockResolvedValue(null);

      await expect(service.ensureSalaExists('999')).rejects.toThrow(CustomError);
      await expect(service.ensureSalaExists('999')).rejects.toThrow(messages.error.resourceNotFound('Sala'));
    });
  });
});
