import CampusFilterBuilder from "@repositories/filters/CampusFilterBuilder";

describe('CampusFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new CampusFilterBuilder();
  });

  describe('comNome()', () => {
    it('deve adicionar regex para nome com mais de 1 caractere', () => {
      builder.comNome('vilhena');
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: 'vilhena',
        $options: 'i',
      });
    });

    it('deve adicionar regex iniciando com letra se nome tiver apenas 1 caractere', () => {
      builder.comNome('v');
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: '^v',
        $options: 'i',
      });
    });

    it('não deve adicionar filtro se nome for vazio', () => {
      builder.comNome('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('nome');
    });
  });

  describe('comCidade()', () => {
    it('deve adicionar regex para cidade', () => {
      builder.comCidade('Porto Velho');
      const filtros = builder.build();
      expect(filtros.cidade).toEqual({
        $regex: 'Porto\\ Velho',
        $options: 'i',
      });
    });

    it('não deve adicionar filtro se cidade for vazia', () => {
      builder.comCidade('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('cidade');
    });
  });

  describe('comAtivo()', () => {
    it('deve definir status como true se ativo for "true"', () => {
      builder.comAtivo('true');
      const filtros = builder.build();
      expect(filtros.status).toBe(true);
    });

    it('deve definir status como false se ativo for "false"', () => {
      builder.comAtivo('false');
      const filtros = builder.build();
      expect(filtros.status).toBe(false);
    });

    it('não deve definir status se valor for inválido', () => {
      builder.comAtivo('sim');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('status');
    });
  });

  describe('escapeRegex()', () => {
    it('deve escapar corretamente caracteres especiais', () => {
      const texto = 'port.o(velho)?+';
      const escaped = builder.escapeRegex(texto);
      expect(escaped).toBe('port\\.o\\(velho\\)\\?\\+');
    });
  });

  describe('build()', () => {
    it('deve retornar objeto de filtros construído', () => {
      builder.comNome('abc').comCidade('xyz').comAtivo('true');
      const filtros = builder.build();
      expect(filtros).toMatchObject({
        nome: { $regex: 'abc', $options: 'i' },
        cidade: { $regex: 'xyz', $options: 'i' },
        status: true
      });
    });
  });
});
