import { CampusSchema, CampusUpdateSchema } from "@utils/validators/schemas/zod/CampusSchema";

describe('CampusSchema', () => {
  it('deve validar um objeto completo e válido', () => {
    const data = {
      nome: 'Campus IFRO',
      telefone: '(69) 98456-7890',
      cidade: 'Vilhena',
      bairro: 'Centro',
      rua: 'Av. Brasil',
      numeroResidencia: '123',
      status: false,
    };

    const result = CampusSchema.parse(data);
    expect(result.nome).toBe('Campus IFRO');
    expect(result.telefone).toBe('(69) 98456-7890');
    expect(result.status).toBe(false);
  });

  it('deve aceitar telefone com apenas números', () => {
    const data = {
      nome: 'Campus IFRO',
      telefone: '69984567890',
      cidade: 'Vilhena'
    };

    const result = CampusSchema.parse(data);
    expect(result.telefone).toBe('69984567890');
  });

  it('deve lançar erro se o nome estiver ausente', () => {
    const data = {
      cidade: 'Vilhena'
    };

    expect(() => CampusSchema.parse(data)).toThrowError(/nome/i);
  });

  it('deve lançar erro se a cidade estiver ausente', () => {
    const data = {
      nome: 'Campus IFRO'
    };

    expect(() => CampusSchema.parse(data)).toThrowError(/cidade/i);
  });

  it('deve lançar erro se o telefone for inválido', () => {
    const data = {
      nome: 'Campus IFRO',
      telefone: 'telefone-invalido',
      cidade: 'Vilhena'
    };

    expect(() => CampusSchema.parse(data)).toThrowError(/Telefone inválido/i);
  });

  it('deve aplicar valor padrão "true" para status se omitido', () => {
    const data = {
      nome: 'Campus IFRO',
      cidade: 'Vilhena'
    };

    const result = CampusSchema.parse(data);
    expect(result.status).toBe(true);
  });
});

describe('CampusUpdateSchema', () => {
  it('deve aceitar objeto parcial com apenas um campo', () => {
    const data = { nome: 'Novo Nome' };
    const result = CampusUpdateSchema.parse(data);
    expect(result.nome).toBe('Novo Nome');
  });

  it('deve aplicar valor padrão "true" para status se omitido na atualização', () => {
    const data = { nome: 'Nome Atualizado' };
    const result = CampusUpdateSchema.parse(data);
    expect(result.status).toBe(true);
  });

  it('deve lançar erro se telefone inválido for fornecido na atualização', () => {
    const data = {
      telefone: '123'
    };

    expect(() => CampusUpdateSchema.parse(data)).toThrowError(/Telefone inválido/i);
  });
});
