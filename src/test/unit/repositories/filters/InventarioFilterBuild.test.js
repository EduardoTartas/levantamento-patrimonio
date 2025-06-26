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

  describe('constructor', () => {
    it('deve inicializar filtros como um objeto vazio', () => {
      expect(builder.build()).toEqual({});
    });
  });

  describe('escapeRegex', () => {
    it('deve escapar caracteres especiais de regex corretamente', () => {
      expect(builder.escapeRegex('test.[]{}()*+?^$|#')).toBe('test\\.\\[\\]\\{\\}\\(\\)\\*\\+\\?\\^\\$\\|\\#');
    });

    it('deve escapar espaços em branco para serem literais no regex', () => {
      expect(builder.escapeRegex('test case with spaces')).toBe('test\\ case\\ with\\ spaces');
    });

    it('não deve alterar strings que não contêm caracteres especiais de regex', () => {
      expect(builder.escapeRegex('test')).toBe('test');
    });

    it('deve escapar vírgulas e pontos', () => {
      expect(builder.escapeRegex('test,value.com')).toBe('test\\,value\\\.com');
    });

    it('deve retornar string vazia se a entrada não for uma string', () => {
      expect(builder.escapeRegex(null)).toBe('');
      expect(builder.escapeRegex(undefined)).toBe('');
      expect(builder.escapeRegex(123)).toBe('');
    });
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

    it('não deve adicionar filtro se o nome for nulo', () => {
      builder.comNome(null);
      expect(builder.build()).toEqual({});
    });

    it('não deve adicionar filtro se o nome for uma string vazia', () => {
      builder.comNome('');
      expect(builder.build()).toEqual({});
    });

    it('não deve adicionar filtro se o nome for uma string contendo apenas espaços', () => {
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
    
    it('deve permitir encadeamento de chamadas', () => {
      expect(builder.comNome('Teste')).toBe(builder);
    });
  });

  describe('comAtivo', () => {
    it('deve adicionar filtro de status true para a string "true"', () => {
      builder.comAtivo('true');
      expect(builder.build()).toEqual({ status: true });
    });

    it('deve adicionar filtro de status true para o booleano true', () => {
      builder.comAtivo(true);
      expect(builder.build()).toEqual({ status: true });
    });

    it('deve adicionar filtro de status false para a string "false"', () => {
      builder.comAtivo('false');
      expect(builder.build()).toEqual({ status: false });
    });

    it('deve adicionar filtro de status false para o booleano false', () => {
      builder.comAtivo(false);
      expect(builder.build()).toEqual({ status: false });
    });

    it('não deve adicionar filtro para valores de ativo diferentes (ex: "qualquer")', () => {
      builder.comAtivo('qualquer');
      expect(builder.build()).toEqual({});
    });

    it('não deve adicionar filtro se ativo for nulo', () => {
      builder.comAtivo(null);
      expect(builder.build()).toEqual({});
    });

    it('deve permitir encadeamento de chamadas', () => {
      expect(builder.comAtivo(true)).toBe(builder);
    });
  });

  describe('comCampus', () => {
    it('não deve adicionar filtro se o nome do campus for nulo', async () => {
      await builder.comCampus(null);
      expect(builder.build()).toEqual({});
      expect(mockBuscarPorNomeCampus).not.toHaveBeenCalled();
    });

    it('não deve adicionar filtro se o nome do campus for uma string vazia', async () => {
      await builder.comCampus('');
      expect(builder.build()).toEqual({});
      expect(mockBuscarPorNomeCampus).not.toHaveBeenCalled();
    });
    
    it('não deve adicionar filtro se o nome do campus for uma string contendo apenas espaços', async () => {
      await builder.comCampus('   ');
      expect(builder.build()).toEqual({});
      expect(mockBuscarPorNomeCampus).not.toHaveBeenCalled();
    });

    it('deve fazer trim no nome do campus antes de buscar', async () => {
        mockBuscarPorNomeCampus.mockResolvedValue([]);
        await builder.comCampus('  CampusExistente  ');
        expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('CampusExistente');
    });

    it('deve adicionar filtro com $in: [] se nenhum campus for encontrado (retorno array vazio)', async () => {
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
    
    it('deve adicionar filtro com $in: [] se buscarPorNome retornar um objeto sem _id', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue({ nome: 'Campus Sem Id' });
      await builder.comCampus('Campus Sem Id');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Campus Sem Id');
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

    it('deve permitir encadeamento de chamadas', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue([]);
      const result = await builder.comCampus('TesteEncadeado');
      expect(result).toBe(builder);
    });
  });

  describe('comData', () => {
    it('não deve adicionar filtro se data for nula ou undefined', () => {
      builder.comData(null);
      expect(builder.build()).toEqual({});
      builder.comData(undefined);
      expect(builder.build()).toEqual({});
    });

    it('não deve adicionar filtro se data for uma string vazia', () => {
      builder.comData('');
      expect(builder.build()).toEqual({});
    });
    
    it('não deve adicionar filtro se data for uma string contendo apenas espaços', () => {
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
      builder.comData('texto-qualquer');
      expect(builder.build()).toEqual({});
    });

    it('deve adicionar filtro de data $gte e $lte para o dia todo em formato DD/MM/YYYY (gerando UTC)', () => {
      const dataStr = '25/12/2023';
      builder.comData(dataStr);
      const filtros = builder.build();

      expect(filtros.data).toBeDefined();
      expect(filtros.data.$gte).toBeInstanceOf(Date);
      expect(filtros.data.$lte).toBeInstanceOf(Date);

      expect(filtros.data.$gte.toISOString()).toBe('2023-12-25T00:00:00.000Z');
      expect(filtros.data.$lte.toISOString()).toBe('2023-12-25T23:59:59.999Z');
    });

    it('deve adicionar filtro de data $gte e $lte para o dia todo em formato YYYY-MM-DD (gerando UTC)', () => {
      const dataStr = '2024-01-15';
      builder.comData(dataStr);
      const filtros = builder.build();

      expect(filtros.data).toBeDefined();
      expect(filtros.data.$gte).toBeInstanceOf(Date);
      expect(filtros.data.$lte).toBeInstanceOf(Date);
      
      expect(filtros.data.$gte.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(filtros.data.$lte.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });

    it('deve adicionar filtro de data $gte e $lte para um objeto Date (considerando o dia local)', () => {
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

    it('deve permitir encadeamento de chamadas', () => {
      expect(builder.comData('2023-01-01')).toBe(builder);
    });
  });
});
