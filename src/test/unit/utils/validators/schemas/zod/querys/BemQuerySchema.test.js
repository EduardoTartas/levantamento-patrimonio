import { BemIdSchema, BemQuerySchema } from "@utils/validators/schemas/zod/querys/BemQuerySchema";

describe('BemIdSchema', () => {
  it('deve aceitar um ObjectId válido', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = BemIdSchema.parse(validId);
    expect(result).toBe(validId);
  });

  it('deve falhar para ObjectId inválido', () => {
    expect(() => BemIdSchema.parse('123')).toThrowError(/ID inválido/);
    expect(() => BemIdSchema.parse('')).toThrowError(/ID inválido/);
  });
});

describe('BemQuerySchema', () => {
  it('deve aceitar todos os campos válidos', () => {
    const input = {
      nome: '  Mesa de Escritório ',
      tombo: '  TOM123456 ',
      sala: '  Sala A101 ',
      auditado: 'true',
      page: '2',
      limite: '20',
    };

    const result = BemQuerySchema.parse(input);
    expect(result.nome).toBe('Mesa de Escritório');
    expect(result.tombo).toBe('TOM123456');
    expect(result.sala).toBe('Sala A101');
    expect(result.auditado).toBe('true');
    expect(result.page).toBe(2);
    expect(result.limite).toBe(20);
  });

  it('deve aplicar valores padrão para page e limite se ausentes', () => {
    const result = BemQuerySchema.parse({});
    expect(result.nome).toBeUndefined();
    expect(result.tombo).toBeUndefined();
    expect(result.sala).toBeUndefined();
    expect(result.auditado).toBeUndefined();
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  it('deve aceitar auditado como true ou false', () => {
    expect(BemQuerySchema.parse({ auditado: 'true' }).auditado).toBe('true');
    expect(BemQuerySchema.parse({ auditado: 'false' }).auditado).toBe('false');
  });

  it('deve converter page e limite string para número', () => {
    expect(BemQuerySchema.parse({ page: '5' }).page).toBe(5);
    expect(BemQuerySchema.parse({ limite: '25' }).limite).toBe(25);
  });

  it('deve aceitar combinação de campos opcionais', () => {
    const input = {
      nome: 'Mesa',
      auditado: 'false',
      page: '3'
    };
    const result = BemQuerySchema.parse(input);
    expect(result.nome).toBe('Mesa');
    expect(result.auditado).toBe('false');
    expect(result.page).toBe(3);
    expect(result.limite).toBe(10);
    expect(result.tombo).toBeUndefined();
    expect(result.sala).toBeUndefined();
  });

  it('deve falhar para nome inválido', () => {
    expect(() => BemQuerySchema.parse({ nome: '    ' })).toThrowError(/Nome não pode ser vazio/);
  });

  it('deve falhar para tombo inválido', () => {
    expect(() => BemQuerySchema.parse({ tombo: '    ' })).toThrowError(/Tombo não pode ser vazio/);
  });

  it('deve falhar para sala inválida', () => {
    expect(() => BemQuerySchema.parse({ sala: '    ' })).toThrowError(/Sala não pode ser vazio/);
  });

  it('deve falhar para auditado inválido', () => {
    expect(() => BemQuerySchema.parse({ auditado: 'yes' })).toThrowError(/Auditado deve ser 'true' ou 'false'/);
  });

  it('deve falhar para page inválido', () => {
    expect(() => BemQuerySchema.parse({ page: '0' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
    expect(() => BemQuerySchema.parse({ page: '-1' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
    expect(() => BemQuerySchema.parse({ page: 'abc' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  it('deve falhar para limite inválido', () => {
    expect(() => BemQuerySchema.parse({ limite: '150' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    expect(() => BemQuerySchema.parse({ limite: '0' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    expect(() => BemQuerySchema.parse({ limite: '-5' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    expect(() => BemQuerySchema.parse({ limite: 'xyz' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });
});
