import BemFilterBuilder from "@repositories/filters/BemFilterBuild";

describe('BemFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new BemFilterBuilder();
  });

  describe('comNome()', () => {
    it('deve adicionar regex para nome com mais de 1 caractere', () => {
      builder.comNome('Mesa');
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: 'Mesa',
        $options: 'i',
      });
    });

    it('deve adicionar regex iniciando com letra se nome tiver apenas 1 caractere', () => {
      builder.comNome('M');
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: '^M',
        $options: 'i',
      });
    });

    it('não deve adicionar filtro se nome for vazio', () => {
      builder.comNome('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('nome');
    });

    it('não deve adicionar filtro se nome for null ou undefined', () => {
      builder.comNome(null);
      const filtros1 = builder.build();
      expect(filtros1).not.toHaveProperty('nome');

      builder.comNome(undefined);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('nome');
    });

    it('deve escapar caracteres especiais no nome', () => {
      builder.comNome('Mesa.de(escritório)');
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: 'Mesa\\.de\\(escritório\\)',
        $options: 'i',
      });
    });

    it('deve retornar this para encadeamento', () => {
      const result = builder.comNome('Mesa');
      expect(result).toBe(builder);
    });
  });

  describe('comTombo()', () => {
    it('deve adicionar filtro regex para tombo', () => {
      builder.comTombo('TOM123456');
      const filtros = builder.build();
      expect(filtros.tombo).toEqual({ $regex: 'TOM123456', $options: 'i' });
    });

    it('não deve adicionar filtro se tombo for vazio', () => {
      builder.comTombo('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('tombo');
    });

    it('não deve adicionar filtro se tombo for null ou undefined', () => {
      builder.comTombo(null);
      const filtros1 = builder.build();
      expect(filtros1).not.toHaveProperty('tombo');

      builder.comTombo(undefined);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('tombo');
    });

    it('deve escapar caracteres especiais no tombo', () => {
      builder.comTombo('TOM.123(456)');
      const filtros = builder.build();
      expect(filtros.tombo).toEqual({ $regex: 'TOM\\.123\\(456\\)', $options: 'i' });
    });

    it('deve retornar this para encadeamento', () => {
      const result = builder.comTombo('TOM123');
      expect(result).toBe(builder);
    });
  });

  describe('comSala()', () => {
    it('deve adicionar filtro para ObjectId válido de sala', () => {
      const salaId = '507f1f77bcf86cd799439011';
      builder.comSala(salaId);
      const filtros = builder.build();
      expect(filtros.sala).toBe(salaId);
    });

    it('não deve adicionar filtro se salaId for vazio', () => {
      builder.comSala('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');
    });

    it('não deve adicionar filtro se salaId for null ou undefined', () => {
      builder.comSala(null);
      const filtros1 = builder.build();
      expect(filtros1).not.toHaveProperty('sala');

      builder.comSala(undefined);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('sala');
    });

    it('não deve adicionar filtro se salaId não for ObjectId válido', () => {
      builder.comSala('not-a-valid-objectid');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');
    });

    it('não deve adicionar filtro se salaId for muito curto', () => {
      builder.comSala('123');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');
    });

    it('não deve adicionar filtro se salaId for muito longo', () => {
      builder.comSala('507f1f77bcf86cd799439011abc');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');
    });

    it('deve retornar this para encadeamento', () => {
      const result = builder.comSala('507f1f77bcf86cd799439011');
      expect(result).toBe(builder);
    });
  });

  describe('comResponsavel()', () => {
    it('deve adicionar regex para nome do responsável', () => {
      builder.comResponsavel('João Silva');
      const filtros = builder.build();
      expect(filtros['responsavel.nome']).toEqual({
        $regex: 'João\\ Silva',
        $options: 'i',
      });
    });

    it('não deve adicionar filtro se responsável for vazio', () => {
      builder.comResponsavel('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('responsavel.nome');
    });

    it('não deve adicionar filtro se responsável for null ou undefined', () => {
      builder.comResponsavel(null);
      const filtros1 = builder.build();
      expect(filtros1).not.toHaveProperty('responsavel.nome');

      builder.comResponsavel(undefined);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('responsavel.nome');
    });

    it('deve escapar caracteres especiais no nome do responsável', () => {
      builder.comResponsavel('João.da(Silva)');
      const filtros = builder.build();
      expect(filtros['responsavel.nome']).toEqual({
        $regex: 'João\\.da\\(Silva\\)',
        $options: 'i',
      });
    });

    it('deve retornar this para encadeamento', () => {
      const result = builder.comResponsavel('João');
      expect(result).toBe(builder);
    });
  });

  describe('comAuditado()', () => {
    it('deve definir auditado como true se valor for "true"', () => {
      builder.comAuditado('true');
      const filtros = builder.build();
      expect(filtros.auditado).toBe(true);
    });

    it('deve definir auditado como true se valor for boolean true', () => {
      builder.comAuditado(true);
      const filtros = builder.build();
      expect(filtros.auditado).toBe(true);
    });

    it('deve definir auditado como false se valor for "false"', () => {
      builder.comAuditado('false');
      const filtros = builder.build();
      expect(filtros.auditado).toBe(false);
    });

    it('deve definir auditado como false se valor for boolean false', () => {
      builder.comAuditado(false);
      const filtros = builder.build();
      expect(filtros.auditado).toBe(false);
    });

    it('não deve definir auditado se valor for inválido', () => {
      builder.comAuditado('maybe');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('auditado');
    });

    it('não deve definir auditado se valor for null ou undefined', () => {
      builder.comAuditado(null);
      const filtros1 = builder.build();
      expect(filtros1).not.toHaveProperty('auditado');

      builder.comAuditado(undefined);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('auditado');
    });

    it('não deve definir auditado se valor for string vazia', () => {
      builder.comAuditado('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('auditado');
    });

    it('deve retornar this para encadeamento', () => {
      const result = builder.comAuditado('true');
      expect(result).toBe(builder);
    });
  });

  describe('getNomeSala()', () => {
    it('deve retornar null por padrão', () => {
      const nomeSala = builder.getNomeSala();
      expect(nomeSala).toBeNull();
    });
  });

  describe('escapeRegex()', () => {
    it('deve escapar corretamente caracteres especiais de regex', () => {
      const texto = 'Mesa.de(escritório)?+[test]*{1,2}^$|#';
      const escaped = builder.escapeRegex(texto);
      expect(escaped).toBe('Mesa\\.de\\(escritório\\)\\?\\+\\[test\\]\\*\\{1\\,2\\}\\^\\$\\|\\#');
    });

    it('deve escapar espaços', () => {
      const texto = 'Mesa de escritório';
      const escaped = builder.escapeRegex(texto);
      expect(escaped).toBe('Mesa\\ de\\ escritório');
    });

    it('deve retornar string vazia se entrada for vazia', () => {
      const escaped = builder.escapeRegex('');
      expect(escaped).toBe('');
    });

    it('deve tratar texto sem caracteres especiais', () => {
      const texto = 'MesaSimples';
      const escaped = builder.escapeRegex(texto);
      expect(escaped).toBe('MesaSimples');
    });
  });

  describe('build()', () => {
    it('deve retornar objeto vazio quando nenhum filtro é definido', () => {
      const filtros = builder.build();
      expect(filtros).toEqual({});
    });

    it('deve retornar objeto de filtros construído com todos os métodos', () => {
      builder
        .comNome('Mesa')
        .comTombo('TOM123')
        .comSala('507f1f77bcf86cd799439011')
        .comResponsavel('João Silva')
        .comAuditado('true');
      
      const filtros = builder.build();
      
      expect(filtros).toMatchObject({
        nome: { $regex: 'Mesa', $options: 'i' },
        tombo: { $regex: 'TOM123', $options: 'i' },
        sala: '507f1f77bcf86cd799439011',
        'responsavel.nome': { $regex: 'João\\ Silva', $options: 'i' },
        auditado: true
      });
    });

    it('deve retornar objeto com apenas filtros válidos', () => {
      builder
        .comNome('Mesa')
        .comTombo('') 
        .comSala('invalid-id')
        .comResponsavel('João')
        .comAuditado('maybe');
      
      const filtros = builder.build();
      
      expect(filtros).toMatchObject({
        nome: { $regex: 'Mesa', $options: 'i' },
        'responsavel.nome': { $regex: 'João', $options: 'i' }
      });
      
      expect(filtros).not.toHaveProperty('tombo');
      expect(filtros).not.toHaveProperty('sala');
      expect(filtros).not.toHaveProperty('auditado');
    });
  });

  describe('Encadeamento de métodos', () => {
    it('deve permitir encadeamento fluente de todos os métodos', () => {
      const result = builder
        .comNome('Mesa')
        .comTombo('TOM123')
        .comSala('507f1f77bcf86cd799439011')
        .comResponsavel('João')
        .comAuditado('true');
      
      expect(result).toBe(builder);
      
      const filtros = result.build();
      expect(Object.keys(filtros)).toHaveLength(5);
    });

    it('deve permitir múltiplas chamadas do mesmo método (sobrescrever)', () => {
      builder
        .comNome('Mesa')
        .comNome('Cadeira');
      
      const filtros = builder.build();
      expect(filtros.nome).toEqual({
        $regex: 'Cadeira',
        $options: 'i'
      });
    });
  });

  describe('Casos extremos', () => {
    it('deve lidar com valores falsy corretamente', () => {
      builder
        .comNome(0)
        .comTombo(false)
        .comSala(0)
        .comResponsavel(false);
      
      const filtros = builder.build();
      expect(filtros).toEqual({});
    });

    it('deve tratar ObjectId com letras maiúsculas e minúsculas', () => {
      const salaIdMaiuscula = '507F1F77BCF86CD799439011';
      builder.comSala(salaIdMaiuscula);
      const filtros = builder.build();
      expect(filtros.sala).toBe(salaIdMaiuscula);
    });
  });
});
