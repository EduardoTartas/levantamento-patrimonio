import { describe, it, expect } from '@jest/globals';
import { LevantamentoSchema, LevantamentoUpdateSchema, fotoUploadValidationSchema } from '@utils/validators/schemas/zod/LevantamentoSchema.js';

describe('LevantamentoSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';
    const invalidObjectId = 'invalid-id';

    it('deve validar um objeto completo e válido', () => {
        const data = {
            inventario: validObjectId,
            bemId: validObjectId,
            salaNova: validObjectId,
            imagem: ['https://example.com/image1.jpg', 'https://example.com/image2.png'],
            estado: 'Em condições de uso',
            ocioso: true
        };

        const result = LevantamentoSchema.parse(data);
        expect(result.inventario).toBe(validObjectId);
        expect(result.bemId).toBe(validObjectId);
        expect(result.salaNova).toBe(validObjectId);
        expect(result.imagem).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.png']);
        expect(result.estado).toBe('Em condições de uso');
        expect(result.ocioso).toBe(true);
    });

    it('deve validar objeto com campos opcionais omitidos', () => {
        const data = {
            inventario: validObjectId,
            bemId: validObjectId,
            estado: 'Inservível'
        };

        const result = LevantamentoSchema.parse(data);
        expect(result.inventario).toBe(validObjectId);
        expect(result.bemId).toBe(validObjectId);
        expect(result.estado).toBe('Inservível');
    });

    it('deve aceitar todos os estados válidos', () => {
        const estados = ['Em condições de uso', 'Inservível', 'Danificado'];
        
        estados.forEach(estado => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                estado
            };

            const result = LevantamentoSchema.parse(data);
            expect(result.estado).toBe(estado);
        });
    });

    it('deve falhar para campos obrigatórios ausentes', () => {
        expect(() => LevantamentoSchema.parse({ bemId: validObjectId, estado: 'Em condições de uso' })).toThrow();
        expect(() => LevantamentoSchema.parse({ inventario: validObjectId, estado: 'Em condições de uso' })).toThrow();
        expect(() => LevantamentoSchema.parse({ inventario: validObjectId, bemId: validObjectId })).toThrow();
    });

    it('deve falhar para ObjectIds inválidos', () => {
        expect(() => LevantamentoSchema.parse({ inventario: invalidObjectId, bemId: validObjectId, estado: 'Em condições de uso' })).toThrow(/Invalid MongoDB ObjectId/);
        expect(() => LevantamentoSchema.parse({ inventario: validObjectId, bemId: invalidObjectId, estado: 'Em condições de uso' })).toThrow(/Invalid MongoDB ObjectId/);
        expect(() => LevantamentoSchema.parse({ inventario: validObjectId, bemId: validObjectId, salaNova: invalidObjectId, estado: 'Em condições de uso' })).toThrow(/Invalid MongoDB ObjectId/);
    });

    it('deve falhar para estado inválido', () => {
        const data = {
            inventario: validObjectId,
            bemId: validObjectId,
            estado: 'Estado Inválido'
        };

        expect(() => LevantamentoSchema.parse(data)).toThrow(/O estado deve ser/);
    });

    it('deve falhar para URL de imagem inválida', () => {
        const data = {
            inventario: validObjectId,
            bemId: validObjectId,
            imagem: ['not-a-url'],
            estado: 'Em condições de uso'
        };

        expect(() => LevantamentoSchema.parse(data)).toThrow(/A URL da imagem é inválida/);
    });

    it('deve falhar para tipo inválido de ocioso', () => {
        const data = {
            inventario: validObjectId,
            bemId: validObjectId,
            estado: 'Em condições de uso',
            ocioso: 'não é boolean'
        };

        expect(() => LevantamentoSchema.parse(data)).toThrow();
    });
});

describe('LevantamentoUpdateSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    it('deve aceitar objeto parcial com apenas um campo', () => {
        const data = { estado: 'Danificado' };
        const result = LevantamentoUpdateSchema.parse(data);
        expect(result.estado).toBe('Danificado');
    });

    it('deve aceitar múltiplos campos para atualização', () => {
        const data = {
            salaNova: validObjectId,
            estado: 'Inservível',
            ocioso: true
        };

        const result = LevantamentoUpdateSchema.parse(data);
        expect(result.salaNova).toBe(validObjectId);
        expect(result.estado).toBe('Inservível');
        expect(result.ocioso).toBe(true);
    });

    it('deve aceitar objeto vazio para atualização', () => {
        const data = {};
        const result = LevantamentoUpdateSchema.parse(data);
        expect(result).toEqual({});
    });

    it('deve falhar para estado inválido', () => {
        const data = { estado: 'Estado Inválido' };
        expect(() => LevantamentoUpdateSchema.parse(data)).toThrow(/O estado deve ser/);
    });

    it('deve falhar para URL de imagem inválida', () => {
        const data = { imagem: ['invalid-url'] };
        expect(() => LevantamentoUpdateSchema.parse(data)).toThrow(/A URL da imagem é inválida/);
    });

    it('não deve aceitar bemId ou inventario para atualização', () => {
        const data = { bemId: validObjectId };
        const result = LevantamentoUpdateSchema.parse(data);
        expect(result.bemId).toBeUndefined();
    });
});

describe('fotoUploadValidationSchema', () => {
    const validBuffer = Buffer.from('fake image data');

    it('deve validar arquivo JPEG válido', () => {
        const data = {
            fieldname: 'foto',
            originalname: 'imagem.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: validBuffer,
            size: 1024
        };

        const result = fotoUploadValidationSchema.parse(data);
        expect(result.mimetype).toBe('image/jpeg');
        expect(result.originalname).toBe('imagem.jpg');
        expect(result.size).toBe(1024);
    });

    it('deve validar arquivo PNG válido', () => {
        const data = {
            originalname: 'imagem.png',
            mimetype: 'image/png',
            buffer: validBuffer,
            size: 2048
        };

        const result = fotoUploadValidationSchema.parse(data);
        expect(result.mimetype).toBe('image/png');
        expect(result.originalname).toBe('imagem.png');
    });

    it('deve aceitar campos opcionais omitidos', () => {
        const data = {
            mimetype: 'image/jpeg',
            buffer: validBuffer,
            size: 1024
        };

        const result = fotoUploadValidationSchema.parse(data);
        expect(result.mimetype).toBe('image/jpeg');
    });

    it('deve falhar para extensão de arquivo inválida', () => {
        const data = {
            originalname: 'arquivo.txt',
            mimetype: 'image/jpeg',
            buffer: validBuffer,
            size: 1024
        };

        expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/deve ter extensão .jpg, .jpeg ou .png/);
    });

    it('deve falhar para mimetype inválido', () => {
        const data = {
            originalname: 'imagem.jpg',
            mimetype: 'text/plain',
            buffer: validBuffer,
            size: 1024
        };

        expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/Invalid input/);
    });

    it('deve falhar para buffer inválido', () => {
        expect(() => fotoUploadValidationSchema.parse({ originalname: 'imagem.jpg', mimetype: 'image/jpeg', buffer: Buffer.alloc(0), size: 1024 })).toThrow(/não pode estar vazio/);
        expect(() => fotoUploadValidationSchema.parse({ originalname: 'imagem.jpg', mimetype: 'image/jpeg', buffer: 'not a buffer', size: 1024 })).toThrow(/buffer do arquivo é inválido/);
    });

    it('deve falhar para tamanho inválido', () => {
        expect(() => fotoUploadValidationSchema.parse({ originalname: 'imagem.jpg', mimetype: 'image/jpeg', buffer: validBuffer, size: 0 })).toThrow(/deve ser maior que zero/);
        expect(() => fotoUploadValidationSchema.parse({ originalname: 'imagem.jpg', mimetype: 'image/jpeg', buffer: validBuffer, size: 6 * 1024 * 1024 })).toThrow(/não pode ser maior que 5MB/);
    });
});
