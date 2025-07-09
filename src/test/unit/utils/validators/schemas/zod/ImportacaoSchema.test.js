import { fileUploadValidationSchema } from '@utils/validators/schemas/zod/ImportacaoSchema';

describe('fileUploadValidationSchema', () => {
    const baseDadosValidos = {
        fieldname: 'csvFile',
        originalname: 'dados_importacao.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('col1,col2\nval1,val2'),
        size: 1024
    };

    it('analisa dados válidos de upload corretamente', () => {
        const resultado = fileUploadValidationSchema.parse(baseDadosValidos);
        expect(resultado).toEqual(baseDadosValidos);
    });

    it('aceita mimetypes válidos', () => {
        expect(fileUploadValidationSchema.parse({ ...baseDadosValidos, mimetype: 'application/csv' }).mimetype).toBe('application/csv');
        expect(fileUploadValidationSchema.parse({ ...baseDadosValidos, mimetype: 'application/vnd.ms-excel' }).mimetype).toBe('application/vnd.ms-excel');
    });

    it('permite campos opcionais ausentes', () => {
        const dadosMinimos = {
            mimetype: 'text/csv',
            buffer: Buffer.from('col1,col2\nval1,val2'),
            size: 1024
        };
        const resultado = fileUploadValidationSchema.parse(dadosMinimos);
        expect(resultado.mimetype).toBe('text/csv');
        expect(resultado.buffer).toBeInstanceOf(Buffer);
        expect(resultado.size).toBe(1024);
        expect(resultado.fieldname).toBeUndefined();
        expect(resultado.originalname).toBeUndefined();
        expect(resultado.encoding).toBeUndefined();
    });

    it('aceita arquivo CSV com dados típicos de importação', () => {
        const csvContent = 'numero_patrimonio,descricao,categoria\n001,Computador Desktop,Informatica\n002,Mesa de Escritorio,Mobiliario';
        const dadosReais = {
            fieldname: 'file',
            originalname: 'patrimonio_importacao.csv',
            encoding: '7bit',
            mimetype: 'text/csv',
            buffer: Buffer.from(csvContent),
            size: csvContent.length
        };
        
        const resultado = fileUploadValidationSchema.parse(dadosReais);
        expect(resultado.originalname).toBe('patrimonio_importacao.csv');
        expect(resultado.buffer.toString()).toBe(csvContent);
    });

    it('falha para originalname com extensão inválida', () => {
        const dadosInvalidos = { ...baseDadosValidos, originalname: 'arquivo.txt' };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos)).toThrowError(/arquivo deve ter a extensão .csv/i);
    });

    it('falha para mimetype inválido', () => {
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, mimetype: 'application/json' })).toThrowError(/Invalid input/);
        
        const { mimetype, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos)).toThrowError(/arquivo enviado não é um CSV válido/i);
    });

    it('falha para buffer inválido', () => {
        const { buffer, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos)).toThrowError(/buffer do arquivo é inválido/i);
        
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, buffer: 'não é um buffer' })).toThrowError(/buffer do arquivo é inválido/i);
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, buffer: Buffer.alloc(0) })).toThrowError(/arquivo CSV não pode estar vazio/i);
    });

    it('falha para size inválido', () => {
        const { size, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos)).toThrowError(/Required/);
        
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, size: 0 })).toThrowError(/tamanho do arquivo deve ser maior que zero/i);
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, size: -100 })).toThrowError(/tamanho do arquivo deve ser maior que zero/i);
        expect(() => fileUploadValidationSchema.parse({ ...baseDadosValidos, size: 61 * 1024 * 1024 })).toThrowError(/arquivo não pode ser maior que 10MB/i);
    });

    it('aceita arquivo no limite máximo de tamanho', () => {
        const dadosNoLimite = { ...baseDadosValidos, size: 60 * 1024 * 1024 };
        const resultado = fileUploadValidationSchema.parse(dadosNoLimite);
        expect(resultado.size).toBe(60 * 1024 * 1024);
    });
});
