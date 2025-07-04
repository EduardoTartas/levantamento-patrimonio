import { BemIdSchema, BemQuerySchema } from "@utils/validators/schemas/zod/querys/BemQuerySchema";

describe('BemIdSchema', () => {
  it('deve aceitar um ObjectId válido', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = BemIdSchema.parse(validId);
    expect(result).toBe(validId);
  });

  it('deve lançar erro para um ObjectId inválido', () => {
    const invalidId = '123';
    expect(() => BemIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
  });

  it('deve lançar erro para string vazia', () => {
    const invalidId = '';
    expect(() => BemIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
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
    const input = {};
    const result = BemQuerySchema.parse(input);
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  it('deve aceitar objeto vazio e aplicar valores padrão', () => {
    const result = BemQuerySchema.parse({});
    expect(result.nome).toBeUndefined();
    expect(result.tombo).toBeUndefined();
    expect(result.sala).toBeUndefined();
    expect(result.auditado).toBeUndefined();
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  // --- Testes para o campo "nome" ---
  it('deve aceitar nome válido e fazer trim', () => {
    const input = { nome: '  Mesa de Reunião  ' };
    const result = BemQuerySchema.parse(input);
    expect(result.nome).toBe('Mesa de Reunião');
  });

  it('deve lançar erro se "nome" for string vazia ou apenas espaços', () => {
    const input = { nome: '    ' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Nome não pode ser vazio/);
  });

  it('deve aceitar nome undefined', () => {
    const input = { tombo: 'TOM123' };
    const result = BemQuerySchema.parse(input);
    expect(result.nome).toBeUndefined();
  });

  // --- Testes para o campo "tombo" ---
  it('deve aceitar tombo válido e fazer trim', () => {
    const input = { tombo: '  TOM123456  ' };
    const result = BemQuerySchema.parse(input);
    expect(result.tombo).toBe('TOM123456');
  });

  it('deve lançar erro se "tombo" for string vazia ou apenas espaços', () => {
    const input = { tombo: '    ' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Tombo não pode ser vazio/);
  });

  it('deve aceitar tombo undefined', () => {
    const input = { nome: 'Mesa' };
    const result = BemQuerySchema.parse(input);
    expect(result.tombo).toBeUndefined();
  });

  // --- Testes para o campo "sala" ---
  it('deve aceitar sala válida e fazer trim', () => {
    const input = { sala: '  Sala A101  ' };
    const result = BemQuerySchema.parse(input);
    expect(result.sala).toBe('Sala A101');
  });

  it('deve lançar erro se "sala" for string vazia ou apenas espaços', () => {
    const input = { sala: '    ' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Sala não pode ser vazio/);
  });

  it('deve aceitar sala undefined', () => {
    const input = { nome: 'Mesa' };
    const result = BemQuerySchema.parse(input);
    expect(result.sala).toBeUndefined();
  });

  // --- Testes para o campo "auditado" ---
  it('deve aceitar auditado como "true"', () => {
    const input = { auditado: 'true' };
    const result = BemQuerySchema.parse(input);
    expect(result.auditado).toBe('true');
  });

  it('deve aceitar auditado como "false"', () => {
    const input = { auditado: 'false' };
    const result = BemQuerySchema.parse(input);
    expect(result.auditado).toBe('false');
  });

  it('deve lançar erro se "auditado" tiver valor inválido', () => {
    const input = { auditado: 'yes' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Auditado deve ser 'true' ou 'false'/);
  });

  it('deve aceitar auditado undefined', () => {
    const input = { nome: 'Mesa' };
    const result = BemQuerySchema.parse(input);
    expect(result.auditado).toBeUndefined();
  });

  // --- Testes para o campo "page" ---
  it('deve converter page string para número', () => {
    const input = { page: '5' };
    const result = BemQuerySchema.parse(input);
    expect(result.page).toBe(5);
  });

  it('deve lançar erro se "page" não for inteiro positivo', () => {
    const input = { page: '0' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  it('deve lançar erro se "page" for negativo', () => {
    const input = { page: '-1' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  it('deve lançar erro se "page" não for número válido', () => {
    const input = { page: 'abc' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  // --- Testes para o campo "limite" ---
  it('deve converter limite string para número', () => {
    const input = { limite: '25' };
    const result = BemQuerySchema.parse(input);
    expect(result.limite).toBe(25);
  });

  it('deve lançar erro se "limite" for maior que 100', () => {
    const input = { limite: '150' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  it('deve lançar erro se "limite" for zero', () => {
    const input = { limite: '0' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  it('deve lançar erro se "limite" for negativo', () => {
    const input = { limite: '-5' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  it('deve lançar erro se "limite" não for número válido', () => {
    const input = { limite: 'xyz' };
    expect(() => BemQuerySchema.parse(input)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  // --- Testes combinados ---
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
    expect(result.limite).toBe(10); // valor padrão
    expect(result.tombo).toBeUndefined();
    expect(result.sala).toBeUndefined();
  });
});
