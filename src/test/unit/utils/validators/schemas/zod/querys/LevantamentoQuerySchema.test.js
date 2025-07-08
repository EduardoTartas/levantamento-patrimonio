import { describe, it, expect } from '@jest/globals';
import { LevantamentoIdSchema, LevantamentoQuerySchema } from '@utils/validators/schemas/zod/querys/LevantamentoQuerySchema.js';

describe('LevantamentoIdSchema', () => {
    it('deve aceitar um ObjectId válido', () => {
        const validId = '507f1f77bcf86cd799439011';
        const result = LevantamentoIdSchema.parse(validId);
        expect(result).toBe(validId);
    });

    it('deve lançar erro para IDs inválidos', () => {
        const invalidIds = ['123', '', '507f1f77bcf86cd799439zzz'];
        
        invalidIds.forEach(id => {
            expect(() => LevantamentoIdSchema.parse(id)).toThrow(/ID inválido/);
        });
    });
});

describe('LevantamentoQuerySchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve aceitar todos os campos válidos e aplicar transformações', () => {
        const input = {
            tombo: '  TOM123456 ',
            sala: validObjectId,
            inventario: validObjectId,
            estado: 'Em condições de uso',
            ocioso: 'true',
            page: '2',
            limite: '20'
        };

        const result = LevantamentoQuerySchema.parse(input);
        expect(result.tombo).toBe('TOM123456');
        expect(result.sala).toBe(validObjectId);
        expect(result.inventario).toBe(validObjectId);
        expect(result.estado).toBe('Em condições de uso');
        expect(result.ocioso).toBe('true');
        expect(result.page).toBe(2);
        expect(result.limite).toBe(20);
    });

    it('deve aplicar valores padrão para page e limite', () => {
        const result = LevantamentoQuerySchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limite).toBe(10);
    });

    it('deve validar campo tombo', () => {
        const valid = LevantamentoQuerySchema.parse({ tombo: '  TOM123456  ' });
        expect(valid.tombo).toBe('TOM123456');
        
        expect(() => LevantamentoQuerySchema.parse({ tombo: '    ' })).toThrow(/O tombo não pode ser vazio/);
    });

    it('deve validar ObjectIds de sala e inventário', () => {
        const validInput = LevantamentoQuerySchema.parse({ sala: validObjectId, inventario: validObjectId });
        expect(validInput.sala).toBe(validObjectId);
        expect(validInput.inventario).toBe(validObjectId);
        
        expect(() => LevantamentoQuerySchema.parse({ sala: 'invalid-id' })).toThrow(/O ID da sala é inválido/);
        expect(() => LevantamentoQuerySchema.parse({ inventario: 'invalid-id' })).toThrow(/O ID do inventário é inválido/);
    });

    it('deve validar estados válidos', () => {
        const estados = ['Em condições de uso', 'Inservível', 'Danificado'];
        
        estados.forEach(estado => {
            const result = LevantamentoQuerySchema.parse({ estado });
            expect(result.estado).toBe(estado);
        });
        
        expect(() => LevantamentoQuerySchema.parse({ estado: 'Estado Inválido' })).toThrow();
    });

    it('deve validar campo ocioso', () => {
        const validTrue = LevantamentoQuerySchema.parse({ ocioso: 'true' });
        expect(validTrue.ocioso).toBe('true');
        
        const validFalse = LevantamentoQuerySchema.parse({ ocioso: 'false' });
        expect(validFalse.ocioso).toBe('false');
        
        expect(() => LevantamentoQuerySchema.parse({ ocioso: 'yes' })).toThrow(/O valor para 'ocioso' deve ser 'true' ou 'false'/);
    });

    it('deve validar campo page', () => {
        const valid = LevantamentoQuerySchema.parse({ page: '5' });
        expect(valid.page).toBe(5);
        
        const invalidValues = ['0', '-1', 'abc'];
        invalidValues.forEach(value => {
            expect(() => LevantamentoQuerySchema.parse({ page: value })).toThrow(/O parâmetro 'page' deve ser um número inteiro maior que 0/);
        });
    });

    it('deve validar campo limite', () => {
        const valid = LevantamentoQuerySchema.parse({ limite: '25' });
        expect(valid.limite).toBe(25);
        
        const validMax = LevantamentoQuerySchema.parse({ limite: '100' });
        expect(validMax.limite).toBe(100);
        
        const invalidValues = ['0', '-5', '150', 'xyz'];
        invalidValues.forEach(value => {
            expect(() => LevantamentoQuerySchema.parse({ limite: value })).toThrow(/O parâmetro 'limite' deve ser um número inteiro entre 1 e 100/);
        });
    });

    it('deve processar combinação de campos', () => {
        const input = {
            tombo: '  TOM-789  ',
            estado: 'Danificado',
            ocioso: 'false',
            page: '3'
        };
        
        const result = LevantamentoQuerySchema.parse(input);
        expect(result.tombo).toBe('TOM-789');
        expect(result.estado).toBe('Danificado');
        expect(result.ocioso).toBe('false');
        expect(result.page).toBe(3);
        expect(result.limite).toBe(10);
    });
});
