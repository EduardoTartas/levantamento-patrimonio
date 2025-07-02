import { SalaIdSchema, SalaQuerySchema } from '@utils/validators/schemas/zod/querys/SalaQuerySchema';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

describe('SalaIdSchema', () => {
  describe('Casos de sucesso', () => {
    test('deve aceitar ObjectIds válidos', () => {
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
  });

  describe('Casos de erro', () => {
    test('deve rejeitar IDs inválidos', () => {
      const invalidIds = [
        '123', '507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111', 
        'invalid_id', '507g1f77bcf86cd799439011', '', '507f1f77-bcf86cd799439011'
      ];

      invalidIds.forEach(id => {
        expect(() => SalaIdSchema.parse(id)).toThrow('ID inválido');
      });
    });

    test('deve rejeitar valores não string', () => {
      [null, undefined, 123, {}, [], true].forEach(value => {
        expect(() => SalaIdSchema.parse(value)).toThrow();
      });
    });
  });
});

describe('SalaQuerySchema', () => {
  describe('Casos de sucesso', () => {
    test('deve aceitar dados válidos e aplicar transformações', () => {
      const result = SalaQuerySchema.parse({
        nome: '  Sala A ', campus: '  Campus X ', bloco: '  Bloco 1 ',
        page: '2', limite: '20'
      });

      expect(result).toEqual({
        nome: 'Sala A', campus: 'Campus X', bloco: 'Bloco 1',
        page: 2, limite: 20
      });
    });

    test('deve processar diferentes valores válidos', () => {
      const testCases = [
        { page: '1', limite: '1', expected: { page: 1, limite: 1 } },
        { page: '50', limite: '100', expected: { page: 50, limite: 100 } },
        { page: '999', limite: '50', expected: { page: 999, limite: 50 } }
      ];

      testCases.forEach(({ page, limite, expected }) => {
        const result = SalaQuerySchema.parse({ page, limite });
        expect(result.page).toBe(expected.page);
        expect(result.limite).toBe(expected.limite);
      });
    });

    test('deve aplicar valores padrão quando ausentes', () => {
      expect(SalaQuerySchema.parse({})).toMatchObject({ page: 1, limite: 10 });
      expect(SalaQuerySchema.parse({ page: '5' })).toMatchObject({ page: 5, limite: 10 });
      expect(SalaQuerySchema.parse({ limite: '25' })).toMatchObject({ page: 1, limite: 25 });
    });

    test('deve remover espaços em branco dos campos de texto', () => {
      const result = SalaQuerySchema.parse({
        nome: '   Laboratório   ', campus: '\t Campus Central \n', bloco: '  Bloco A  '
      });

      expect(result).toMatchObject({
        nome: 'Laboratório', campus: 'Campus Central', bloco: 'Bloco A'
      });
    });

    test('deve aceitar ausência de campos opcionais', () => {
      [{}, { nome: 'Test' }, { campus: 'Test' }, { bloco: 'Test' }].forEach(input => {
        expect(() => SalaQuerySchema.parse(input)).not.toThrow();
      });
    });
  });

  describe('Casos de erro - Page', () => {
    test('deve rejeitar page inválido', () => {
      ['-1', '0'].forEach(page => {
        expect(() => SalaQuerySchema.parse({ page })).toThrow('Page deve ser um número inteiro maior que 0');
      });
    });

    test('deve tratar valores não numéricos e extremos', () => {
      ['abc', 'null', 'undefined', '-999'].forEach(page => {
        expect(() => SalaQuerySchema.parse({ page })).toThrow();
      });
    });

    test('deve aceitar decimais convertidos para inteiros', () => {
      expect(() => SalaQuerySchema.parse({ page: '1.5' })).not.toThrow();
      expect(SalaQuerySchema.parse({ page: '1.5' }).page).toBe(1);
    });
  });

  describe('Casos de erro - Limite', () => {
    test('deve rejeitar limite inválido', () => {
      ['0', '-1', '101', '150'].forEach(limite => {
        expect(() => SalaQuerySchema.parse({ limite })).toThrow('Limite deve ser um número inteiro entre 1 e 100');
      });
    });

    test('deve validar limites das bordas', () => {
      expect(() => SalaQuerySchema.parse({ limite: '0' })).toThrow();
      expect(() => SalaQuerySchema.parse({ limite: '101' })).toThrow();
      expect(() => SalaQuerySchema.parse({ limite: '1' })).not.toThrow();
      expect(() => SalaQuerySchema.parse({ limite: '100' })).not.toThrow();
    });

    test('deve tratar valores não numéricos e aceitar decimais', () => {
      expect(() => SalaQuerySchema.parse({ limite: 'abc' })).toThrow();
      expect(() => SalaQuerySchema.parse({ limite: '1.5' })).not.toThrow();
      expect(SalaQuerySchema.parse({ limite: '1.5' }).limite).toBe(1);
    });
  });

  describe('Casos de erro - Campos de texto', () => {
    test('deve rejeitar campos vazios após trim', () => {
      const cases = [{ nome: '   ' }, { campus: '\t\n' }, { bloco: '  ' }];
      cases.forEach(input => {
        const field = Object.keys(input)[0];
        const errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} não pode ser vazio`;
        expect(() => SalaQuerySchema.parse(input)).toThrow(errorMessage);
      });
    });

    test('deve aceitar undefined para campos opcionais', () => {
      [{ nome: undefined }, { bloco: undefined }, {}].forEach(input => {
        expect(() => SalaQuerySchema.parse(input)).not.toThrow();
      });
    });
  });

  describe('Casos extremos e edge cases', () => {
    test('deve processar entrada completa corretamente', () => {
      const input = {
        nome: 'Sala Completa', campus: 'Campus Principal', 
        bloco: 'Bloco Administrativo', page: '10', limite: '50'
      };

      const result = SalaQuerySchema.parse(input);
      expect(result).toEqual({
        nome: 'Sala Completa', campus: 'Campus Principal',
        bloco: 'Bloco Administrativo', page: 10, limite: 50
      });
    });

    test('deve lidar com caracteres especiais', () => {
      ['Sala-101', 'Lab. Informática', 'Auditório (Principal)', 'Sala_Especial'].forEach(nome => {
        expect(() => SalaQuerySchema.parse({ nome })).not.toThrow();
        expect(SalaQuerySchema.parse({ nome }).nome).toBe(nome);
      });
    });

    test('deve validar tipos de erro retornados', () => {
      try {
        SalaQuerySchema.parse({ page: 'invalid', limite: '200', nome: '   ' });
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        expect(error.errors).toHaveLength(3);
      }
    });

    test('deve processar valores numéricos com zeros à esquerda', () => {
      const cases = [
        { page: '01', expected: 1 }, { page: '007', expected: 7 },
        { limite: '05', expected: 5 }, { limite: '099', expected: 99 }
      ];

      cases.forEach(({ page, limite, expected }) => {
        const input = page ? { page } : { limite };
        const result = SalaQuerySchema.parse(input);
        const field = page ? 'page' : 'limite';
        expect(result[field]).toBe(expected);
      });
    });
  });

  describe('Integração e comportamento combinado', () => {
    test('deve funcionar com combinações parciais de campos', () => {
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

    test('deve manter consistência entre múltiplas validações', () => {
      const input = { nome: 'Consistente', page: '3', limite: '30' };
      const result1 = SalaQuerySchema.parse(input);
      const result2 = SalaQuerySchema.parse(input);
      
      expect(result1).toEqual(result2);
      expect(result1).toMatchObject({ nome: 'Consistente', page: 3, limite: 30 });
    });
  });
});
