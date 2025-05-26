import UsuarioFilterBuilder from '@repositories/filters/UsuarioFilterBuilder';
jest.mock('@repositories/UsuarioRepository');
jest.mock('@models/Usuario');

const mockBuscarPorNomeCampus = jest.fn();
jest.mock('@repositories/CampusRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      buscarPorNome: mockBuscarPorNomeCampus,
    };
  });
});

describe('UsuarioFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    require('@repositories/CampusRepository').mockClear();
    mockBuscarPorNomeCampus.mockClear();
    builder = new UsuarioFilterBuilder();
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
  });

  describe('comNome', () => {
    it('deve adicionar filtro de nome com regex para nome com mais de um caractere', () => {
      const nome = 'Usuário Teste';
      const nomeEscaped = builder.escapeRegex(nome);
      builder.comNome(nome);
      expect(builder.build()).toEqual({
        nome: { $regex: nomeEscaped, $options: 'i' },
      });
    });

    it('deve adicionar filtro de nome com regex iniciando com ^ para nome com um único caractere', () => {
      const nome = 'U';
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

    it('deve adicionar filtro com $in: [] se nenhum campus for encontrado', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue([]); // Retorna array vazio
      await builder.comCampus('Campus Inexistente');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Campus Inexistente');
      expect(builder.build()).toEqual({
        campus: { $in: [] },
      });
    });

    it('deve adicionar filtro com $in: [] se buscarPorNome retornar null', async () => {
        mockBuscarPorNomeCampus.mockResolvedValue(null); // Retorna null
        await builder.comCampus('Campus Fantasma');
        expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Campus Fantasma');
        expect(builder.build()).toEqual({
          campus: { $in: [] },
        });
      });

    it('deve adicionar filtro com IDs dos campi encontrados (array de resultados)', async () => {
      const mockCampi = [
        { _id: 'idCampus1', nome: 'Campus Alpha' },
        { _id: 'idCampus2', nome: 'Campus Beta' },
      ];
      mockBuscarPorNomeCampus.mockResolvedValue(mockCampi);
      await builder.comCampus('Alpha');
      expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Alpha');
      expect(builder.build()).toEqual({
        campus: { $in: ['idCampus1', 'idCampus2'] },
      });
    });

    it('deve adicionar filtro com ID do campus encontrado (objeto único como resultado)', async () => {
        const mockCampusUnico = { _id: 'idCampusUnico', nome: 'Campus Unico' };
        mockBuscarPorNomeCampus.mockResolvedValue(mockCampusUnico);
        await builder.comCampus('Unico');
        expect(mockBuscarPorNomeCampus).toHaveBeenCalledWith('Unico');
        expect(builder.build()).toEqual({
          campus: { $in: ['idCampusUnico'] },
        });
      });

    it('deve permitir encadeamento de chamadas', async () => {
      mockBuscarPorNomeCampus.mockResolvedValue([]);
      const result = await builder.comCampus('Teste');
      expect(result).toBe(builder);
    });
  });

  describe('build', () => {
    it('deve retornar corretamente todos os filtros configurados', async () => {
      const nome = 'Admin';
      const ativo = true;
      const nomeCampus = 'Central';
      const mockCampi = [{ _id: 'campusIdCentral', nome: 'Campus Central' }];

      const nomeEscaped = builder.escapeRegex(nome);
      mockBuscarPorNomeCampus.mockResolvedValue(mockCampi);

      await builder.comNome(nome).comAtivo(ativo).comCampus(nomeCampus);

      expect(builder.build()).toEqual({
        nome: { $regex: nomeEscaped, $options: 'i' },
        status: true,
        campus: { $in: ['campusIdCentral'] },
      });
    });

    it('deve retornar um objeto vazio se nenhum filtro for aplicado', () => {
      expect(builder.build()).toEqual({});
    });
  });

  describe('Combinação de Filtros Complexos', () => {
    it('deve construir a query corretamente com nome, status inativo e campus não encontrado', async () => {
      const nome = 'Visitante';
      const nomeEscaped = builder.escapeRegex(nome);

      mockBuscarPorNomeCampus.mockResolvedValue([]);

      await builder.comNome(nome).comAtivo(false).comCampus('Inexistente');
      expect(builder.build()).toEqual({
        nome: { $regex: nomeEscaped, $options: 'i' },
        status: false,
        campus: { $in: [] },
      });
    });
  });
});