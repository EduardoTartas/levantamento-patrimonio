import { CampusIdSchema, CampusQuerySchema } from "@utils/validators/schemas/zod/querys/CampusQuerySchema";

describe('CampusIdSchema', () => {
  it('deve aceitar um ObjectId válido', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = CampusIdSchema.parse(validId);
    expect(result).toBe(validId);
  });

  it('deve lançar erro para um ObjectId inválido', () => {
    const invalidId = '123';
    expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
  });
});

describe('CampusQuerySchema', () => {
  it('deve aceitar todos os campos válidos', () => {
    const input = {
      nome: '  Campus IFRO ',
      cidade: '  Vilhena ',
      ativo: 'true',
      page: '2',
      limite: '20',
    };

    const result = CampusQuerySchema.parse(input);
    expect(result.nome).toBe('Campus IFRO');
    expect(result.cidade).toBe('Vilhena');
    expect(result.ativo).toBe('true');
    expect(result.page).toBe(2);
    expect(result.limite).toBe(20);
  });

  it('deve aplicar valores padrão para page e limite se ausentes', () => {
    const input = {};
    const result = CampusQuerySchema.parse(input);
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  it('deve lançar erro se "ativo" tiver valor inválido', () => {
    const input = { ativo: 'yes' };
    expect(() => CampusQuerySchema.parse(input)).toThrowError(/Ativo deve ser 'true' ou 'false'/);
  });

  it('deve lançar erro se "page" não for inteiro positivo', () => {
    const input = { page: '0' };
    expect(() => CampusQuerySchema.parse(input)).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  it('deve lançar erro se "limite" for maior que 100', () => {
    const input = { limite: '150' };
    expect(() => CampusQuerySchema.parse(input)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  it('deve lançar erro se "nome" for string vazia ou apenas espaços', () => {
    const input = { nome: '    ' };
    expect(() => CampusQuerySchema.parse(input)).toThrowError(/Nome não pode ser vazio/);
  });

  it('deve lançar erro se "cidade" for string vazia ou apenas espaços', () => {
    const input = { cidade: '   ' };
    expect(() => CampusQuerySchema.parse(input)).toThrowError(/Localidade não pode ser vazio/);
  });
});
