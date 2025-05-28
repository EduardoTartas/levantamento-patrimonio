import { z } from "zod";
// mongoose não é usado diretamente nos testes, mas o schema o utiliza.
// import mongoose from 'mongoose';
// Certifique-se de que o caminho para o seu arquivo de schema está correto
import { InventarioQuerySchema } from '@utils/validators/schemas/zod/querys/InventarioQuerySchema'; // Supondo que este é o caminho correto

describe('InventarioQuerySchema', () => {
    it('should parse an empty object correctly (using defaults from transform)', () => {
        const resultado = InventarioQuerySchema.parse({});
        expect(resultado).toEqual({
            nome: undefined,    // Opcional, sem default explícito no transform para ausência
            ativo: undefined,   // Opcional, sem default explícito no transform para ausência
            data: undefined,    // Opcional e não fornecido, resulta em undefined.
            page: 1,            // Default de transform: (val ? parseInt(val, 10) : 1)
            limite: 10,         // Default de transform: (val ? parseInt(val, 10) : 10)
        });
    });

    it('should parse valid data and apply transformations correctly (including trim for data)', () => {
        const query = {
            nome: '  Inventário Central  ',
            ativo: 'true',
            data: '  2024-05-26  ', // Será trimado pelo schema
            page: '3',
            limite: '25',
        };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado).toEqual({
            nome: 'Inventário Central', // 'nome' é trimado pela transformação no schema.
            ativo: 'true',
            data: '2024-05-26',     // 'data' agora também é trimada pela transformação no schema.
            page: 3,
            limite: 25,
        });
    });

    it('should allow "ativo" as "false"', () => {
        const query = { ativo: 'false' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.ativo).toBe('false');
        // Verifica se os defaults são aplicados corretamente quando outros campos são omitidos
        expect(resultado.page).toBe(1);
        expect(resultado.limite).toBe(10);
    });

    // Testes para 'nome'
    it('throws an error when "nome" is an empty string (after trim attempt by refine)', () => {
        const query = { nome: '' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Nome não pode ser vazio/);
    });

    it('throws an error when "nome" contains only spaces (after trim attempt by refine)', () => {
        const query = { nome: '   ' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Nome não pode ser vazio/);
    });

    // Testes para 'ativo'
    it('throws an error when "ativo" is an invalid string value', () => {
        const query = { ativo: 'talvez' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    it('throws an error when "ativo" is a number (as string) that is not "true" or "false"', () => {
        const query = { ativo: '1' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    // Testes para 'data'

    it('throws an error when "data" contains only spaces (after trim attempt by refine)', () => {
        const query = { data: '   ' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Data não pode ser vazia/);
    });

    it('should accept valid "data" string (and it should be trimmed if schema has trim transform)', () => {
        const query = { data: '2023-10-15' }; // Já está trimada
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.data).toBe('2023-10-15');
    });

    it('should accept "data" string with leading/trailing spaces and trim it (if schema has trim transform)', () => {
        const query = { data: ' 2023-10-15 ' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.data).toBe('2023-10-15');
    });


    // Testes para 'page'
    it('throws an error when "page" is provided as a non-numeric string', () => {
        const query = { page: 'abc' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('throws an error when "page" is "0" (as string)', () => {
        const query = { page: '0' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('throws an error when "page" is a negative number (as string)', () => {
        const query = { page: '-1' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('should parse "page" as float string and take integer part (e.g., "2.5" becomes 2)', () => {
        const query = { page: '2.5' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.page).toBe(2);
    });

    // Testes para 'limite'
    it('throws an error when "limite" is provided as a non-numeric string', () => {
        const query = { limite: 'xyz' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('throws an error when "limite" is "0" (as string)', () => {
        const query = { limite: '0' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('throws an error when "limite" is a negative number (as string)', () => {
        const query = { limite: '-5' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('throws an error when "limite" is greater than 100 (as string)', () => {
        const query = { limite: '101' };
        expect(() => InventarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('should parse "limite" as float string and take integer part (e.g., "20.7" becomes 20)', () => {
        const query = { limite: '20.7' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(20);
    });

    it('should accept "limite" as "1" (string)', () => {
        const query = { limite: '1' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(1);
    });

    it('should accept "limite" as "100" (string)', () => {
        const query = { limite: '100' };
        const resultado = InventarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(100);
    });
});