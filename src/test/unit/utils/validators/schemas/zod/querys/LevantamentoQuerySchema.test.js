import { describe, it, expect } from '@jest/globals';
import { LevantamentoIdSchema, LevantamentoQuerySchema } from '@utils/validators/schemas/zod/querys/LevantamentoQuerySchema.js';

describe('LevantamentoIdSchema', () => {
    it('deve aceitar um ObjectId válido', () => {
        const validId = '507f1f77bcf86cd799439011';
        const result = LevantamentoIdSchema.parse(validId);
        expect(result).toBe(validId);
    });

    it('deve lançar erro para um ObjectId inválido', () => {
        const invalidId = '123';
        expect(() => LevantamentoIdSchema.parse(invalidId)).toThrow(/ID inválido/);
    });

    it('deve lançar erro para string vazia', () => {
        const invalidId = '';
        expect(() => LevantamentoIdSchema.parse(invalidId)).toThrow(/ID inválido/);
    });

    it('deve lançar erro para ObjectId com caracteres inválidos', () => {
        const invalidId = '507f1f77bcf86cd799439zzz';
        expect(() => LevantamentoIdSchema.parse(invalidId)).toThrow(/ID inválido/);
    });
});

describe('LevantamentoQuerySchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    describe('Casos de sucesso', () => {
        it('deve aceitar todos os campos válidos', () => {
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

        it('deve aplicar valores padrão para page e limite se ausentes', () => {
            const input = {};
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.page).toBe(1);
            expect(result.limite).toBe(10);
        });

        it('deve aceitar objeto vazio e aplicar valores padrão', () => {
            const result = LevantamentoQuerySchema.parse({});
            expect(result.tombo).toBeUndefined();
            expect(result.sala).toBeUndefined();
            expect(result.inventario).toBeUndefined();
            expect(result.estado).toBeUndefined();
            expect(result.ocioso).toBeUndefined();
            expect(result.page).toBe(1);
            expect(result.limite).toBe(10);
        });

        it('deve aceitar todos os estados válidos', () => {
            const estados = ['Em condições de uso', 'Inservível', 'Danificado'];
            
            estados.forEach(estado => {
                const input = { estado };
                const result = LevantamentoQuerySchema.parse(input);
                expect(result.estado).toBe(estado);
            });
        });
    });

    describe('Testes para o campo "tombo"', () => {
        it('deve aceitar tombo válido e fazer trim', () => {
            const input = { tombo: '  TOM123456  ' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.tombo).toBe('TOM123456');
        });

        it('deve lançar erro se "tombo" for string vazia ou apenas espaços', () => {
            const input = { tombo: '    ' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O tombo não pode ser vazio/);
        });

        it('deve aceitar tombo undefined', () => {
            const input = { estado: 'Em condições de uso' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.tombo).toBeUndefined();
        });

        it('deve aceitar tombo com caracteres especiais', () => {
            const input = { tombo: '  TOM-123/456_ABC  ' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.tombo).toBe('TOM-123/456_ABC');
        });
    });

    describe('Testes para o campo "sala"', () => {
        it('deve aceitar ObjectId de sala válido', () => {
            const input = { sala: validObjectId };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.sala).toBe(validObjectId);
        });

        it('deve lançar erro para ObjectId de sala inválido', () => {
            const input = { sala: 'invalid-id' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O ID da sala é inválido/);
        });

        it('deve aceitar sala undefined', () => {
            const input = { tombo: 'TOM123' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.sala).toBeUndefined();
        });

        it('deve lançar erro para sala com string vazia', () => {
            const input = { sala: '' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O ID da sala é inválido/);
        });
    });

    describe('Testes para o campo "inventario"', () => {
        it('deve aceitar ObjectId de inventário válido', () => {
            const input = { inventario: validObjectId };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.inventario).toBe(validObjectId);
        });

        it('deve lançar erro para ObjectId de inventário inválido', () => {
            const input = { inventario: 'invalid-id' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O ID do inventário é inválido/);
        });

        it('deve aceitar inventario undefined', () => {
            const input = { tombo: 'TOM123' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.inventario).toBeUndefined();
        });

        it('deve lançar erro para inventario com string vazia', () => {
            const input = { inventario: '' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O ID do inventário é inválido/);
        });
    });

    describe('Testes para o campo "estado"', () => {
        it('deve aceitar estado "Em condições de uso"', () => {
            const input = { estado: 'Em condições de uso' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.estado).toBe('Em condições de uso');
        });

        it('deve aceitar estado "Inservível"', () => {
            const input = { estado: 'Inservível' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.estado).toBe('Inservível');
        });

        it('deve aceitar estado "Danificado"', () => {
            const input = { estado: 'Danificado' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.estado).toBe('Danificado');
        });

        it('deve lançar erro para estado inválido', () => {
            const input = { estado: 'Estado Inválido' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow();
        });

        it('deve aceitar estado undefined', () => {
            const input = { tombo: 'TOM123' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.estado).toBeUndefined();
        });
    });

    describe('Testes para o campo "ocioso"', () => {
        it('deve aceitar ocioso como "true"', () => {
            const input = { ocioso: 'true' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.ocioso).toBe('true');
        });

        it('deve aceitar ocioso como "false"', () => {
            const input = { ocioso: 'false' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.ocioso).toBe('false');
        });

        it('deve lançar erro se "ocioso" tiver valor inválido', () => {
            const input = { ocioso: 'yes' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O valor para 'ocioso' deve ser 'true' ou 'false'/);
        });

        it('deve aceitar ocioso undefined', () => {
            const input = { tombo: 'TOM123' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.ocioso).toBeUndefined();
        });

        it('deve lançar erro para valores booleanos (não string)', () => {
            const input = { ocioso: true };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow();
        });
    });

    describe('Testes para o campo "page"', () => {
        it('deve converter page string para número', () => {
            const input = { page: '5' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.page).toBe(5);
        });

        it('deve lançar erro se "page" não for inteiro positivo', () => {
            const input = { page: '0' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'page' deve ser um número inteiro maior que 0/);
        });

        it('deve lançar erro se "page" for negativo', () => {
            const input = { page: '-1' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'page' deve ser um número inteiro maior que 0/);
        });

        it('deve lançar erro se "page" não for número válido', () => {
            const input = { page: 'abc' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'page' deve ser um número inteiro maior que 0/);
        });

        it('deve aplicar valor padrão 1 quando page não fornecido', () => {
            const input = {};
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.page).toBe(1);
        });
    });

    describe('Testes para o campo "limite"', () => {
        it('deve converter limite string para número', () => {
            const input = { limite: '25' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.limite).toBe(25);
        });

        it('deve lançar erro se "limite" for maior que 100', () => {
            const input = { limite: '150' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'limite' deve ser um número inteiro entre 1 e 100/);
        });

        it('deve lançar erro se "limite" for zero', () => {
            const input = { limite: '0' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'limite' deve ser um número inteiro entre 1 e 100/);
        });

        it('deve lançar erro se "limite" for negativo', () => {
            const input = { limite: '-5' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'limite' deve ser um número inteiro entre 1 e 100/);
        });

        it('deve lançar erro se "limite" não for número válido', () => {
            const input = { limite: 'xyz' };
            expect(() => LevantamentoQuerySchema.parse(input)).toThrow(/O parâmetro 'limite' deve ser um número inteiro entre 1 e 100/);
        });

        it('deve aplicar valor padrão 10 quando limite não fornecido', () => {
            const input = {};
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.limite).toBe(10);
        });

        it('deve aceitar limite no valor máximo permitido (100)', () => {
            const input = { limite: '100' };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.limite).toBe(100);
        });
    });

    describe('Testes combinados', () => {
        it('deve aceitar combinação de campos opcionais', () => {
            const input = {
                tombo: 'TOM456',
                estado: 'Danificado',
                ocioso: 'false',
                page: '3'
            };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.tombo).toBe('TOM456');
            expect(result.estado).toBe('Danificado');
            expect(result.ocioso).toBe('false');
            expect(result.page).toBe(3);
            expect(result.limite).toBe(10); // valor padrão
            expect(result.sala).toBeUndefined();
            expect(result.inventario).toBeUndefined();
        });

        it('deve processar todos os campos com trim e transformações', () => {
            const input = {
                tombo: '  TOM-789  ',
                sala: validObjectId,
                inventario: validObjectId,
                estado: 'Em condições de uso',
                ocioso: 'true',
                page: '1',
                limite: '50'
            };
            const result = LevantamentoQuerySchema.parse(input);
            expect(result.tombo).toBe('TOM-789');
            expect(result.sala).toBe(validObjectId);
            expect(result.inventario).toBe(validObjectId);
            expect(result.estado).toBe('Em condições de uso');
            expect(result.ocioso).toBe('true');
            expect(result.page).toBe(1);
            expect(result.limite).toBe(50);
        });
    });
});
