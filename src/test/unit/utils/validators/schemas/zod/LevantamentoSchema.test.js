import { describe, it, expect } from '@jest/globals';
import { LevantamentoSchema, LevantamentoUpdateSchema, fotoUploadValidationSchema } from '@utils/validators/schemas/zod/LevantamentoSchema.js';

describe('LevantamentoSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';
    const invalidObjectId = 'invalid-id';

    describe('Casos de sucesso', () => {
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

        it('deve aceitar campos opcionais quando fornecidos', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                estado: 'Em condições de uso',
                imagem: ['https://example.com/test.jpg'],
                ocioso: true
            };

            const result = LevantamentoSchema.parse(data);
            expect(result.imagem).toEqual(['https://example.com/test.jpg']);
            expect(result.ocioso).toBe(true);
        });
    });

    describe('Casos de erro', () => {
        it('deve lançar erro se inventario estiver ausente', () => {
            const data = {
                bemId: validObjectId,
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow();
        });

        it('deve lançar erro se bemId estiver ausente', () => {
            const data = {
                inventario: validObjectId,
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow();
        });

        it('deve lançar erro se estado estiver ausente', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow();
        });

        it('deve lançar erro para inventario com ObjectId inválido', () => {
            const data = {
                inventario: invalidObjectId,
                bemId: validObjectId,
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow(/Invalid MongoDB ObjectId/);
        });

        it('deve lançar erro para bemId com ObjectId inválido', () => {
            const data = {
                inventario: validObjectId,
                bemId: invalidObjectId,
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow(/Invalid MongoDB ObjectId/);
        });

        it('deve lançar erro para salaNova com ObjectId inválido', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                salaNova: invalidObjectId,
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow(/Invalid MongoDB ObjectId/);
        });

        it('deve lançar erro para estado inválido', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                estado: 'Estado Inválido'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow(/O estado deve ser/);
        });

        it('deve lançar erro para URL de imagem inválida', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                imagem: ['not-a-url', 'https://example.com/valid.jpg'],
                estado: 'Em condições de uso'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow(/A URL da imagem é inválida/);
        });

        it('deve lançar erro para ocioso com tipo inválido', () => {
            const data = {
                inventario: validObjectId,
                bemId: validObjectId,
                estado: 'Em condições de uso',
                ocioso: 'não é boolean'
            };

            expect(() => LevantamentoSchema.parse(data)).toThrow();
        });
    });
});

describe('LevantamentoUpdateSchema', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    describe('Casos de sucesso', () => {
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
    });

    describe('Casos de erro', () => {
        it('deve lançar erro para estado inválido na atualização', () => {
            const data = { estado: 'Estado Inválido' };
            expect(() => LevantamentoUpdateSchema.parse(data)).toThrow(/O estado deve ser/);
        });

        it('deve lançar erro para URL de imagem inválida na atualização', () => {
            const data = { imagem: ['invalid-url'] };
            expect(() => LevantamentoUpdateSchema.parse(data)).toThrow(/A URL da imagem é inválida/);
        });

        it('não deve aceitar bemId ou inventario para atualização', () => {
            const data = { bemId: validObjectId };
            const result = LevantamentoUpdateSchema.parse(data);
            expect(result.bemId).toBeUndefined();
        });
    });
});

describe('fotoUploadValidationSchema', () => {
    const validBuffer = Buffer.from('fake image data');

    describe('Casos de sucesso', () => {
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
    });

    describe('Casos de erro', () => {
        it('deve lançar erro para extensão de arquivo inválida', () => {
            const data = {
                originalname: 'arquivo.txt',
                mimetype: 'image/jpeg',
                buffer: validBuffer,
                size: 1024
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/deve ter extensão .jpg, .jpeg ou .png/);
        });

        it('deve lançar erro para mimetype inválido', () => {
            const data = {
                originalname: 'imagem.jpg',
                mimetype: 'text/plain',
                buffer: validBuffer,
                size: 1024
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/Invalid input/);
        });

        it('deve lançar erro para buffer vazio', () => {
            const data = {
                originalname: 'imagem.jpg',
                mimetype: 'image/jpeg',
                buffer: Buffer.alloc(0),
                size: 1024
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/não pode estar vazio/);
        });

        it('deve lançar erro para buffer inválido', () => {
            const data = {
                originalname: 'imagem.jpg',
                mimetype: 'image/jpeg',
                buffer: 'not a buffer',
                size: 1024
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/buffer do arquivo é inválido/);
        });

        it('deve lançar erro para tamanho zero', () => {
            const data = {
                originalname: 'imagem.jpg',
                mimetype: 'image/jpeg',
                buffer: validBuffer,
                size: 0
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/deve ser maior que zero/);
        });

        it('deve lançar erro para arquivo muito grande (>5MB)', () => {
            const data = {
                originalname: 'imagem.jpg',
                mimetype: 'image/jpeg',
                buffer: validBuffer,
                size: 6 * 1024 * 1024
            };

            expect(() => fotoUploadValidationSchema.parse(data)).toThrow(/não pode ser maior que 5MB/);
        });
    });
});
