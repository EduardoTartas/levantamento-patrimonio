import { SalaIdSchema, SalaQuerySchema } from '@utils/validators/schemas/zod/querys/SalaQuerySchema';
import mongoose from 'mongoose';

describe('SalaIdSchema', () => {
  it('deve aceitar um ObjectId válido', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    expect(() => SalaIdSchema.parse(validId)).not.toThrow();
  });

  it('deve rejeitar um ID inválido', () => {
    expect(() => SalaIdSchema.parse('123')).toThrow('ID inválido');
  });
});

describe('SalaQuerySchema', () => {
  it('deve aceitar dados válidos e aplicar transformações', () => {
    const result = SalaQuerySchema.parse({
      nome: '  Sala A ',
      campus: '  Campus X ',
      bloco: '  Bloco 1 ',
      page: '2',
      limite: '20',
    });

    expect(result).toEqual({
      nome: 'Sala A',
      campus: 'Campus X',
      bloco: 'Bloco 1',
      page: 2,
      limite: 20,
    });
  });

  it('deve aplicar valores padrão para page e limite', () => {
    const result = SalaQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limite).toBe(10);
  });

  it('deve rejeitar page inválido', () => {
    expect(() => SalaQuerySchema.parse({ page: '-1' })).toThrow('Page deve ser um número inteiro maior que 0');
  });

  it('deve rejeitar limite inválido', () => {
    expect(() => SalaQuerySchema.parse({ limite: '150' })).toThrow('Limite deve ser um número inteiro entre 1 e 100');
  });

  it('deve rejeitar nome vazio se enviado', () => {
    expect(() => SalaQuerySchema.parse({ nome: '   ' })).toThrow('Nome não pode ser vazio');
  });

  it('deve aceitar ausência de nome, campus e bloco', () => {
    const result = SalaQuerySchema.parse({});
    expect(result).toMatchObject({});
  });
});
