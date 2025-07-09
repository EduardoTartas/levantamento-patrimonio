import { CampusIdSchema } from '@utils/validators/schemas/zod/querys/ImpotacaoQuerySchema';

describe('CampusIdSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve validar ObjectId válido', () => {
        const validIds = [validObjectId, '507f191e810c19729de860ea'];
        
        validIds.forEach(id => {
            const resultado = CampusIdSchema.parse(id);
            expect(resultado).toBe(id);
        });
    });

    it('deve lançar erro para ObjectIds inválidos', () => {
        const invalidIds = [
            '123',
            'nao-e-um-objectid-valido',
            '507f1f77bcf86cd79943901g',
            '',
            '507f1f77bcf86cd799439011123',
            '507f1f77bcf86cd79943 011',
            '507f1f77bcf86cd79943901@'
        ];
        
        invalidIds.forEach(id => {
            expect(() => CampusIdSchema.parse(id)).toThrow(/ID inválido/);
        });
    });

    it('deve lançar erro para valores não-string', () => {
        const invalidValues = [null, undefined];
        
        expect(() => CampusIdSchema.parse(null)).toThrow(/Expected string, received null/);
        expect(() => CampusIdSchema.parse(undefined)).toThrow(/Required/);
    });
});