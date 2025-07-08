import { CampusIdSchema, CampusQuerySchema } from "@utils/validators/schemas/zod/querys/CampusQuerySchema";

describe('CampusIdSchema', () => {
  it('deve aceitar um ObjectId válido', () => {
    const validId = '507f1f77bcf86cd799439011';
    const result = CampusIdSchema.parse(validId);
    expect(result).toBe(validId);
  });

  it('deve falhar para ObjectId inválido', () => {
    expect(() => CampusIdSchema.parse('123')).toThrowError(/ID inválido/);
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
    const result = CampusQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  it('deve aceitar ativo como true ou false', () => {
    expect(CampusQuerySchema.parse({ ativo: 'true' }).ativo).toBe('true');
    expect(CampusQuerySchema.parse({ ativo: 'false' }).ativo).toBe('false');
  });

  it('deve falhar para ativo inválido', () => {
    expect(() => CampusQuerySchema.parse({ ativo: 'yes' })).toThrowError(/Ativo deve ser 'true' ou 'false'/);
  });

  it('deve falhar para page inválido', () => {
    expect(() => CampusQuerySchema.parse({ page: '0' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
    expect(() => CampusQuerySchema.parse({ page: 'abc' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
  });

  it('deve falhar para limite inválido', () => {
    expect(() => CampusQuerySchema.parse({ limite: '0' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    expect(() => CampusQuerySchema.parse({ limite: '101' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
  });

  it('deve falhar para nome ou cidade vazios', () => {
    expect(() => CampusQuerySchema.parse({ nome: '   ' })).toThrowError(/Nome não pode ser vazio/);
    expect(() => CampusQuerySchema.parse({ cidade: '   ' })).toThrowError(/Localidade não pode ser vazio/);
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
