import InventarioFilterBuilder from '@repositories/filters/InventarioFilterBuild.js';

jest.mock('@models/Inventario.js');
jest.mock('@repositories/InventarioRepository.js');

const mockBuscarPorNomeCampus = jest.fn();
jest.mock('@repositories/CampusRepository.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      buscarPorNome: mockBuscarPorNomeCampus,
    };
  });
});

describe('InventarioFilterBuilder', () => {
  let builder;
  let CampusRepositoryMock;

  beforeEach(() => {
    CampusRepositoryMock = require('@repositories/CampusRepository.js');
    CampusRepositoryMock.mockClear();
    mockBuscarPorNomeCampus.mockClear();
    builder = new InventarioFilterBuilder();
  });

  describe('comNome', () => {
    it('deve adicionar filtro de nome com regex para nome com mais de um caractere', () => {
      const nome = 'Inventário Teste';
      const nomeEscaped = builder.escapeRegex(nome);
      builder.comNome(nome);
      expect(builder.build()).toEqual({
        nome: { $regex: nomeEscaped, $options: 'i' },
      });
    });

    it('deve adicionar filtro de nome com regex iniciando com ^ para nome com um único caractere', () => {
      const nome = 'I';
      const nomeEscaped = builder.escapeRegex(nome);
      builder.comNome(nome);
      expect(builder.build()).toEqual({
        nome: { $regex: `^${nomeEscaped}`, $options: 'i' },
      });
    });

    it('não deve adicionar filtro se o nome for nulo ou vazio', () => {
      builder.comNome(null);
      expect(builder.build()).toEqual({});

      builder.comNome('');
      expect(builder.build()).toEqual({});

      builder.comNome('   ');
      expect(builder.build()).toEqual({});
    });

    it('deve fazer trim no nome antes de aplicar o filtro', () => {
        const nome = '  TesteTrim  ';
        const nomeEscaped = builder.escapeRegex('TesteTrim');
        builder.comNome(nome);
        expect(builder.build()).toEqual({
          nome: { $regex: nomeEscaped, $options: 'i' },
        });
    });
  });

  describe('comAtivo', () => {
    it('deve adicionar filtro de status true para a string "true" ou booleano true', () => {
      builder.comAtivo('true');
      expect(builder.build()).toEqual({ status: true });

      builder.comAtivo(true);
      expect(builder.build()).toEqual({ status: true });
    });

    it('deve adicionar filtro de status false para a string "false" ou booleano false', () => {
      builder.comAtivo('false');
      expect(builder.build()).toEqual({ status: false });

      builder.comAtivo(false);
      expect(builder.build()).toEqual({ status: false });
    });

    it('não deve adicionar filtro para valores inválidos ou nulos', () => {
      builder.comAtivo('qualquer');
      expect(builder.build()).toEqual({});

      builder.comAtivo(null);
      expect(builder.build()).toEqual({});
    });
  });

  describe('comCampus', () => {
    it('não deve adicionar filtro se o nome do campus for nulo ou vazio', async () => {
      await builder.comCampus(null);
      expect(builder.build()).toEqual({});
      expect(mockBuscarPorNomeCampus).not.toHaveBeenCalled();

      await builder.comCampus('');
      expect(builder.build()).toEqual({});

      await builder.comCampus('   ');
      expect(builder.build()).toEqual({});
    });

    it('deve fazer trim no nome do campus antes de buscar', async () => {
        mockBuscarPorNomeCampus.mockResolvedValue([]);
        await builder.comCampus('  CampusExistente  ');
        expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('CampusExistente');
    });

    it('deve adicionar filtro com $in: [] se nenhum campus for encontrado', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue([]);
      await builder.comCampus('Campus Inexistente');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Campus Inexistente');
      expect(builder.build()).toEqual({
        campus: { $in: [] },
      });
    });

    it('deve adicionar filtro com $in: [] se buscarPorNome retornar null', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue(null);
      await builder.comCampus('Campus Fantasma');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Campus Fantasma');
      expect(builder.build()).toEqual({
        campus: { $in: [] },
      });
    });

    it('deve adicionar filtro com IDs dos campi encontrados (array de resultados)', async () => {
      const mockCampi = [
        { _id: 'idCampusA', nome: 'Campus Alpha' },
        { _id: 'idCampusB', nome: 'Campus Beta' },
      ];
      mockBuscarPorNomeCampus.mockResolvedValue(mockCampi);
      await builder.comCampus('Alpha');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Alpha');
      expect(builder.build()).toEqual({
        campus: { $in: ['idCampusA', 'idCampusB'] },
      });
    });

    it('deve adicionar filtro com ID do campus encontrado (objeto único como resultado)', async () => {
      const mockCampusUnico = { _id: 'idCampusUnicoRet', nome: 'Campus Unico Exemplo' };
      mockBuscarPorNomeCampus.mockResolvedValue(mockCampusUnico);
      await builder.comCampus('Unico Exemplo');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Unico Exemplo');
      expect(builder.build()).toEqual({
        campus: { $in: ['idCampusUnicoRet'] },
      });
    });
  });

  describe('comData', () => {
    it('não deve adicionar filtro se data for nula, undefined ou vazia', () => {
      builder.comData(null);
      expect(builder.build()).toEqual({});
      
      builder.comData('');
      expect(builder.build()).toEqual({});
      
      builder.comData('   ');
      expect(builder.build()).toEqual({});
    });

    it('não deve adicionar filtro se data for uma string inválida', () => {
      builder.comData('data-invalida');
      expect(builder.build()).toEqual({});
      
      builder.comData('32/13/2023');
      expect(builder.build()).toEqual({});
      
      builder.comData('30/02/2024');
      expect(builder.build()).toEqual({});
    });

    it('deve adicionar filtro de data $gte e $lte para o dia todo em formato DD/MM/YYYY', () => {
      const dataStr = '25/12/2023';
      builder.comData(dataStr);
      const filtros = builder.build();

      expect(filtros.data).toBeDefined();
      expect(filtros.data.$gte).toBeInstanceOf(Date);
      expect(filtros.data.$lte).toBeInstanceOf(Date);

      expect(filtros.data.$gte.toISOString()).toBe('2023-12-25T00:00:00.000Z');
      expect(filtros.data.$lte.toISOString()).toBe('2023-12-25T23:59:59.999Z');
    });

    it('deve adicionar filtro de data $gte e $lte para o dia todo em formato YYYY-MM-DD', () => {
      const dataStr = '2024-01-15';
      builder.comData(dataStr);
      const filtros = builder.build();

      expect(filtros.data).toBeDefined();
      expect(filtros.data.$gte).toBeInstanceOf(Date);
      expect(filtros.data.$lte).toBeInstanceOf(Date);
      
      expect(filtros.data.$gte.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(filtros.data.$lte.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });

    it('deve adicionar filtro de data $gte e $lte para um objeto Date', () => {
      const dateObj = new Date(2023, 5, 10, 15, 30);
      builder.comData(dateObj);
      const filtros = builder.build();

      expect(filtros.data).toBeDefined();
      const expectedStartDate = new Date(dateObj);
      expectedStartDate.setHours(0,0,0,0);
      
      const expectedEndDate = new Date(dateObj);
      expectedEndDate.setHours(23,59,59,999);

      expect(filtros.data.$gte.getTime()).toBe(expectedStartDate.getTime());
      expect(filtros.data.$lte.getTime()).toBe(expectedEndDate.getTime());

      expect(filtros.data.$gte.getFullYear()).toBe(2023);
      expect(filtros.data.$gte.getMonth()).toBe(5);
      expect(filtros.data.$gte.getDate()).toBe(10);
      expect(filtros.data.$gte.getHours()).toBe(0);
      expect(filtros.data.$lte.getHours()).toBe(23);
    });
  });

  describe('build()', () => {
    it('deve retornar objeto vazio quando nenhum filtro é definido', () => {
      expect(builder.build()).toEqual({});
    });

    it('deve retornar objeto com todos os filtros aplicados', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue([{ _id: 'campusId123', nome: 'Campus Teste' }]);
      
      builder.comNome('Inventário Teste');
      builder.comAtivo('true');
      await builder.comCampus('Campus Teste');
      builder.comData('2023-12-25');
      
      const filtros = builder.build();
      
      expect(filtros).toMatchObject({
        nome: { $regex: 'Inventário\\ Teste', $options: 'i' },
        status: true,
        campus: { $in: ['campusId123'] },
        data: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      });
    });
  });
});
