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

    it('não deve adicionar filtro se nome for vazio ou null', () => {
      builder.comNome('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('nome');

      builder.comNome(null);
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
  });

  describe('comTombo()', () => {
    it('deve adicionar filtro regex para tombo', () => {
      builder.comTombo('TOM123456');
      const filtros = builder.build();
      expect(filtros.tombo).toEqual({ $regex: 'TOM123456', $options: 'i' });
    });

    it('não deve adicionar filtro se tombo for vazio ou null', () => {
      builder.comTombo('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('tombo');

      builder.comTombo(null);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('tombo');
    });

    it('deve escapar caracteres especiais no tombo', () => {
      builder.comTombo('TOM.123(456)');
      const filtros = builder.build();
      expect(filtros.tombo).toEqual({ $regex: 'TOM\\.123\\(456\\)', $options: 'i' });
    });
  });

  describe('comSala()', () => {
    it('deve adicionar filtro para ObjectId válido de sala', () => {
      const salaId = '507f1f77bcf86cd799439011';
      builder.comSala(salaId);
      const filtros = builder.build();
      expect(filtros.sala).toBe(salaId);
    });

    it('não deve adicionar filtro se salaId for inválido', () => {
      builder.comSala('not-a-valid-objectid');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');
    });

    it('não deve adicionar filtro se salaId for vazio ou null', () => {
      builder.comSala('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('sala');

      builder.comSala(null);
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('sala');
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

    it('não deve adicionar filtro se responsável for vazio ou null', () => {
      builder.comResponsavel('');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('responsavel.nome');

      builder.comResponsavel(null);
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
  });

  describe('comAuditado()', () => {
    it('deve definir auditado como true se valor for "true" ou boolean true', () => {
      builder.comAuditado('true');
      const filtros = builder.build();
      expect(filtros.auditado).toBe(true);

      builder.comAuditado(true);
      const filtros2 = builder.build();
      expect(filtros2.auditado).toBe(true);
    });

    it('deve definir auditado como false se valor for "false" ou boolean false', () => {
      builder.comAuditado('false');
      const filtros = builder.build();
      expect(filtros.auditado).toBe(false);

      builder.comAuditado(false);
      const filtros2 = builder.build();
      expect(filtros2.auditado).toBe(false);
    });

    it('não deve definir auditado se valor for inválido ou vazio', () => {
      builder.comAuditado('maybe');
      const filtros = builder.build();
      expect(filtros).not.toHaveProperty('auditado');

      builder.comAuditado('');
      const filtros2 = builder.build();
      expect(filtros2).not.toHaveProperty('auditado');
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
});
