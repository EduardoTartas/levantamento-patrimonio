import { SalaIdSchema, SalaQuerySchema } from '@utils/validators/schemas/zod/querys/SalaQuerySchema';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

describe('SalaIdSchema', () => {
  it('deve aceitar ObjectIds válidos', () => {
    const validIds = [
      new mongoose.Types.ObjectId().toString(),
      '507f1f77bcf86cd799439011',
      '123456789012345678901234',
      'ABCDEFABCDEFABCDEFABCDEF',
      '000000000000000000000000'
    ];

    validIds.forEach(id => {
      expect(() => SalaIdSchema.parse(id)).not.toThrow();
      expect(SalaIdSchema.parse(id)).toBe(id);
    });
  });

  it('deve rejeitar IDs inválidos', () => {
    const invalidIds = [
      '123', '507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111', 
      'invalid_id', '507g1f77bcf86cd799439011', '', '507f1f77-bcf86cd799439011'
    ];

    invalidIds.forEach(id => {
      expect(() => SalaIdSchema.parse(id)).toThrow('ID inválido');
    });
  });

  it('deve rejeitar valores não string', () => {
    [null, undefined, 123, {}, [], true].forEach(value => {
      expect(() => SalaIdSchema.parse(value)).toThrow();
    });
  });
});

describe('SalaQuerySchema', () => {
  it('deve aceitar dados válidos e aplicar transformações', () => {
    const result = SalaQuerySchema.parse({
      nome: '  Sala A ', campus: '  Campus X ', bloco: '  Bloco 1 ',
      page: '2', limite: '20'
    });

    expect(result).toEqual({
      nome: 'Sala A', campus: 'Campus X', bloco: 'Bloco 1',
      page: 2, limite: 20
    });
  });

  it('deve aplicar valores padrão quando ausentes', () => {
    expect(SalaQuerySchema.parse({})).toMatchObject({ page: 1, limite: 10 });
    expect(SalaQuerySchema.parse({ page: '5' })).toMatchObject({ page: 5, limite: 10 });
    expect(SalaQuerySchema.parse({ limite: '25' })).toMatchObject({ page: 1, limite: 25 });
  });

  it('deve remover espaços em branco dos campos de texto', () => {
    const result = SalaQuerySchema.parse({
      nome: '   Laboratório   ', campus: '\t Campus Central \n', bloco: '  Bloco A  '
    });

    expect(result).toMatchObject({
      nome: 'Laboratório', campus: 'Campus Central', bloco: 'Bloco A'
    });
  });

  it('deve aceitar ausência de campos opcionais', () => {
    [{}, { nome: 'Test' }, { campus: 'Test' }, { bloco: 'Test' }].forEach(input => {
      expect(() => SalaQuerySchema.parse(input)).not.toThrow();
    });
  });

  it('deve aceitar decimais convertidos para inteiros', () => {
    expect(SalaQuerySchema.parse({ page: '1.5' }).page).toBe(1);
    expect(SalaQuerySchema.parse({ limite: '1.5' }).limite).toBe(1);
  });

  it('deve validar limites das bordas', () => {
    expect(() => SalaQuerySchema.parse({ limite: '1' })).not.toThrow();
    expect(() => SalaQuerySchema.parse({ limite: '100' })).not.toThrow();
  });

  it('deve funcionar com combinações parciais de campos', () => {
    const combinations = [
      { nome: 'Teste', page: '2' },
      { campus: 'Central', limite: '20' },
      { bloco: 'A', nome: 'Lab', page: '1', limite: '5' }
    ];

    combinations.forEach(input => {
      expect(() => SalaQuerySchema.parse(input)).not.toThrow();
      const result = SalaQuerySchema.parse(input);
      
      if (input.nome) expect(result.nome).toBe(input.nome);
      if (input.campus) expect(result.campus).toBe(input.campus);
      if (input.bloco) expect(result.bloco).toBe(input.bloco);
      if (input.page) expect(result.page).toBe(parseInt(input.page, 10));
      if (input.limite) expect(result.limite).toBe(parseInt(input.limite, 10));
    });
  });

  it('deve rejeitar page inválido', () => {
    ['-1', '0', 'abc', 'null', 'undefined', '-999'].forEach(page => {
      expect(() => SalaQuerySchema.parse({ page })).toThrow();
    });
  });

  it('deve rejeitar limite inválido', () => {
    ['0', '-1', '101', '150', 'abc'].forEach(limite => {
      expect(() => SalaQuerySchema.parse({ limite })).toThrow();
    });
  });

  it('deve rejeitar campos vazios após trim', () => {
    const cases = [{ nome: '   ' }, { campus: '\t\n' }, { bloco: '  ' }];
    cases.forEach(input => {
      const field = Object.keys(input)[0];
      const errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} não pode ser vazio`;
      expect(() => SalaQuerySchema.parse(input)).toThrow(errorMessage);
    });
  });

  it('deve validar tipos de erro retornados', () => {
    try {
      SalaQuerySchema.parse({ page: 'invalid', limite: '200', nome: '   ' });
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      expect(error.errors).toHaveLength(3);
    }
  });
});
