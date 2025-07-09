import { clear } from 'winston';
import { UsuarioIdSchema, UsuarioQuerySchema } from '@utils/validators/schemas/zod/querys/UsuarioQuerySchema';

describe('UsuarioIdSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve validar um ObjectId válido', () => {
        const resultado = UsuarioIdSchema.parse(validObjectId);
        expect(resultado).toBe(validObjectId);
    });

    it('deve falhar para ObjectId inválido', () => {
        expect(() => UsuarioIdSchema.parse('123')).toThrowError(/ID inválido/);
        expect(() => UsuarioIdSchema.parse('nao-e-um-objectid-valido')).toThrowError(/ID inválido/);
        expect(() => UsuarioIdSchema.parse('507f1f77bcf86cd79943901g')).toThrowError(/ID inválido/);
        expect(() => UsuarioIdSchema.parse(null)).toThrowError(/"message":\s*"Expected string, received null"/);
    });
});

describe('UsuarioQuerySchema', () => {
    it('deve analisar um objeto vazio corretamente usando defaults', () => {
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

    it('deve permitir ativo como false', () => {
        const query = { ativo: 'false' };
        const resultado = UsuarioQuerySchema.parse(query);
        expect(resultado.ativo).toBe('false');
    });

    it('deve analisar page e limite como float strings convertendo para int', () => {
        expect(UsuarioQuerySchema.parse({ page: '2.5' }).page).toBe(2);
        expect(UsuarioQuerySchema.parse({ limite: '20.7' }).limite).toBe(20);
    });

    it('deve aceitar limite nos valores extremos', () => {
        expect(UsuarioQuerySchema.parse({ limite: '1' }).limite).toBe(1);
        expect(UsuarioQuerySchema.parse({ limite: '100' }).limite).toBe(100);
    });

    it('deve falhar para nome inválido', () => {
        expect(() => UsuarioQuerySchema.parse({ nome: '' })).toThrowError(/Nome não pode ser vazio/);
        expect(() => UsuarioQuerySchema.parse({ nome: '   ' })).toThrowError(/Nome não pode ser vazio/);
    });

    it('deve falhar para ativo inválido', () => {
        expect(() => UsuarioQuerySchema.parse({ ativo: 'talvez' })).toThrowError(/Ativo deve ser 'true' ou 'false'/);
        expect(() => UsuarioQuerySchema.parse({ ativo: '1' })).toThrowError(/Ativo deve ser 'true' ou 'false'/);
    });

    it('deve falhar para campus inválido', () => {
        expect(() => UsuarioQuerySchema.parse({ campus: '' })).toThrowError(/campus não pode ser vazio/);
        expect(() => UsuarioQuerySchema.parse({ campus: '   ' })).toThrowError(/campus não pode ser vazio/);
    });

    it('deve falhar para page inválido', () => {
        expect(() => UsuarioQuerySchema.parse({ page: 'abc' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
        expect(() => UsuarioQuerySchema.parse({ page: '0' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
        expect(() => UsuarioQuerySchema.parse({ page: '-1' })).toThrowError(/Page deve ser um número inteiro maior que 0/);
    });

    it('deve falhar para limite inválido', () => {
        expect(() => UsuarioQuerySchema.parse({ limite: 'xyz' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => UsuarioQuerySchema.parse({ limite: '0' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => UsuarioQuerySchema.parse({ limite: '-5' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
        expect(() => UsuarioQuerySchema.parse({ limite: '101' })).toThrowError(/Limite deve ser um número inteiro entre 1 e 100/);
    });
});