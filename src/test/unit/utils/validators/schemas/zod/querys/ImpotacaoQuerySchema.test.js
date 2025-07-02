import { CampusIdSchema } from '@utils/validators/schemas/zod/querys/ImpotacaoQuerySchema';

describe('CampusIdSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve validar um ObjectId válido', () => {
        const resultado = CampusIdSchema.parse(validObjectId);
        expect(resultado).toBe(validObjectId);
    });

    it('deve lançar um erro para um ObjectId inválido (curto demais)', () => {
        const invalidId = '123';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para um ObjectId inválido (formato incorreto)', () => {
        const invalidId = 'nao-e-um-objectid-valido';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para um ObjectId inválido (caracteres inválidos)', () => {
        const invalidId = '507f1f77bcf86cd79943901g';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar um erro para null', () => {
        expect(() => CampusIdSchema.parse(null)).toThrowError(/"message":\s*"Expected string, received null"/);
    });

    it('deve lançar um erro para undefined', () => {
        expect(() => CampusIdSchema.parse(undefined)).toThrowError(/"message":\s*"Required"/);
    });

    it('deve lançar um erro para string vazia', () => {
        const invalidId = '';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve aceitar ObjectId com 24 caracteres hexadecimais válidos', () => {
        const validId = '507f191e810c19729de860ea';
        const resultado = CampusIdSchema.parse(validId);
        expect(resultado).toBe(validId);
    });

    it('deve lançar erro para ObjectId muito longo', () => {
        const invalidId = '507f1f77bcf86cd799439011123';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar erro para ObjectId com espaços', () => {
        const invalidId = '507f1f77bcf86cd79943 011';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });

    it('deve lançar erro para ObjectId com caracteres especiais', () => {
        const invalidId = '507f1f77bcf86cd79943901@';
        expect(() => CampusIdSchema.parse(invalidId)).toThrowError(/ID inválido/);
    });
});