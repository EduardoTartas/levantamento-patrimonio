import { clear } from 'winston';
import { UsuarioIdSchema, UsuarioQuerySchema } from '@utils/validators/schemas/zod/querys/UsuarioQuerySchema';

describe('UsuarioIdSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve validar um ObjectId válido', () => {
        const resultado = UsuarioIdSchema.parse(validObjectId);
        expect(resultado).toBe(validObjectId);
    });

    it('deve lançar um erro para um ObjectId inválido (curto demais)', () => {
        const invalidId = '123';
        expect(() => UsuarioIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para um ObjectId inválido (formato incorreto)', () => {
        const invalidId = 'nao-e-um-objectid-valido';
        expect(() => UsuarioIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para um ObjectId inválido (caracteres inválidos)', () => {
        const invalidId = '507f1f77bcf86cd79943901g';
        expect(() => UsuarioIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para null', () => {
        expect(() => UsuarioIdSchema.parse(null)).toThrowError(/"message":\s*"Expected string, received null"/);
    });
});

describe('UsuarioQuerySchema', () => {
    it('deve analisar um objeto vazio corretamente (usando defaults)', () => {
        const resultado = UsuarioQuerySchema.parse({});
        expect(resultado).toEqual({
            nome: undefined,
            ativo: undefined,
            campus: undefined,
            page: 1,
            limite: 10,
        });
    });

    it('deve analisar dados válidos e aplicar transformações', () => {
        const query = {
            nome: '  Usuário Teste  ',
            ativo: 'true',
            campus: '  Campus X  ',
            page: '2',
            limite: '20',
        };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado).toEqual({
            nome: 'Usuário Teste',
            ativo: 'true',
            campus: 'Campus X',
            page: 2,
            limite: 20,
        });
    });

    it('deve permitir "ativo" como "false"', () => {
        const query = { ativo: 'false' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.ativo).toBe('false');
    });

    // Testes para 'nome'
    it('lança um erro quando "nome" é uma string vazia', () => {
        const query = { nome: '' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Nome não pode ser vazio/);
    });

    it('lança um erro quando "nome" contém apenas espaços', () => {
        const query = { nome: '   ' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Nome não pode ser vazio/);
    });

    // Testes para 'ativo'
    it('lança um erro quando "ativo" é inválido', () => {
        const query = { ativo: 'talvez' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    it('lança um erro quando "ativo" é um número (como string)', () => {
        const query = { ativo: '1' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    // Testes para 'campus'

    it('lança um erro quando "campus" é uma string vazia', () => {
        const query = { campus: '' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/campus não pode ser vazio/);
    });

    it('lança um erro quando "campus" contém apenas espaços', () => {
        const query = { campus: '   ' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/campus não pode ser vazio/);
    });

    // Testes para 'page'
    it('lança um erro quando "page" é fornecido como string não numérica', () => {
        const query = { page: 'abc' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('lança um erro quando "page" é "0"', () => {
        const query = { page: '0' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('lança um erro quando "page" é um número negativo', () => {
        const query = { page: '-1' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('deve analisar "page" como float string (e.g., "2.5" torna-se 2)', () => {
        const query = { page: '2.5' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.page).toBe(2);
    });

    // Testes para 'limite'
    it('lança um erro quando "limite" é fornecido como string não numérica', () => {
        const query = { limite: 'xyz' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('lança um erro quando "limite" é "0"', () => {
        const query = { limite: '0' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('lança um erro quando "limite" é um número negativo', () => {
        const query = { limite: '-5' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('lança um erro quando "limite" é maior que 100', () => {
        const query = { limite: '101' };
        expect(() => UsuarioQuerySchema.parse(query)).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });

    it('deve analisar "limite" como float string (e.g., "20.7" torna-se 20)', () => {
        const query = { limite: '20.7' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(20);
    });

    it('deve aceitar "limite" como 1', () => {
        const query = { limite: '1' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(1);
    });

    it('deve aceitar "limite" como 100', () => {
        const query = { limite: '100' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.limite).toBe(100);
    });
});