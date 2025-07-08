import { InventarioQuerySchema } from '@utils/validators/schemas/zod/querys/InventarioQuerySchema';

describe('InventarioQuerySchema', () => {
    it('should parse an empty object correctly using defaults', () => {
        const resultado = InventarioQuerySchema.parse({});
        expect(resultado).toEqual({
            nome: undefined,
            ativo: undefined,
            data: undefined,
            page: 1,
            limite: 10,
        });
    });

    it('should parse valid data and apply transformations correctly', () => {
        const query = {
            nome: '  Inventário Central  ',
            ativo: 'true',
            data: '  2024-05-26  ',
            page: '3',
            limite: '25',
        };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado).toEqual({
            nome: 'Inventário Central',
            ativo: 'true',
            data: '2024-05-26',
            page: 3,
            limite: 25,
        });
    });

    it('should allow ativo as false', () => {
        const query = { ativo: 'false' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.ativo).toBe('false');
        expect(resultado.page).toBe(1);
        expect(resultado.limite).toBe(10);
    });

    it('should accept valid data string and trim it', () => {
        expect(InventarioQuerySchema.parse({ data: '2023-10-15' }).data).toBe('2023-10-15');
        expect(InventarioQuerySchema.parse({ data: ' 2023-10-15 ' }).data).toBe('2023-10-15');
    });

    it('should parse page and limite as float strings and take integer part', () => {
        expect(InventarioQuerySchema.parse({ page: '2.5' }).page).toBe(2);
        expect(InventarioQuerySchema.parse({ limite: '20.7' }).limite).toBe(20);
    });

    it('should accept limite at boundary values', () => {
        expect(InventarioQuerySchema.parse({ limite: '1' }).limite).toBe(1);
        expect(InventarioQuerySchema.parse({ limite: '100' }).limite).toBe(100);
    });

    it('throws an error when nome is empty or spaces only', () => {
        expect(() => InventarioQuerySchema.parse({ nome: '' })).toThrowError(/Nome não pode ser vazio/);
        expect(() => InventarioQuerySchema.parse({ nome: '   ' })).toThrowError(/Nome não pode ser vazio/);
    });

    it('throws an error when ativo is invalid', () => {
        expect(() => InventarioQuerySchema.parse({ ativo: 'talvez' })).toThrowError(/Ativo deve ser 'true' ou 'false'/);
        expect(() => InventarioQuerySchema.parse({ ativo: '1' })).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    it('throws an error when data contains only spaces', () => {
        expect(() => InventarioQuerySchema.parse({ data: '   ' })).toThrowError(/Data não pode ser vazia/);
    });

    it('throws an error when page is invalid', () => {
        expect(() => InventarioQuerySchema.parse({ page: 'abc' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
        expect(() => InventarioQuerySchema.parse({ page: '0' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
        expect(() => InventarioQuerySchema.parse({ page: '-1' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('throws an error when limite is invalid', () => {
        expect(() => InventarioQuerySchema.parse({ limite: 'xyz' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => InventarioQuerySchema.parse({ limite: '0' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => InventarioQuerySchema.parse({ limite: '-5' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => InventarioQuerySchema.parse({ limite: '101' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });
});
