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

    it('aceita mimetype application/csv', () => {
        const dadosComMimetypeAlternativo = { 
            ...baseDadosValidos, 
            mimetype: 'application/csv' 
        };
        const resultado = fileUploadValidationSchema.parse(dadosComMimetypeAlternativo);
        expect(resultado.mimetype).toBe('application/csv');
    });

    it('aceita mimetype application/vnd.ms-excel', () => {
        const dadosComMimetypeExcel = { 
            ...baseDadosValidos, 
            mimetype: 'application/vnd.ms-excel' 
        };
        const resultado = fileUploadValidationSchema.parse(dadosComMimetypeExcel);
        expect(resultado.mimetype).toBe('application/vnd.ms-excel');
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

    it('lança erro quando originalname não termina com .csv', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            originalname: 'arquivo.txt' 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/arquivo deve ter a extensão .csv/i);
    });

    it('permite originalname vazio (campo opcional)', () => {
        const dadosComNomeVazio = { 
            ...baseDadosValidos, 
            originalname: '' 
        };
        const resultado = fileUploadValidationSchema.parse(dadosComNomeVazio);
        expect(resultado.originalname).toBe('');
    });

    it('lança erro quando mimetype é inválido', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            mimetype: 'application/json' 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/Invalid input/);
    });

    it('lança erro quando mimetype está ausente', () => {
        const { mimetype, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/arquivo enviado não é um CSV válido/i);
    });

    it('lança erro quando buffer está ausente', () => {
        const { buffer, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/buffer do arquivo é inválido/i);
    });

    it('lança erro quando buffer não é uma instância de Buffer', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            buffer: 'não é um buffer' 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/buffer do arquivo é inválido/i);
    });

    it('lança erro quando buffer está vazio', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            buffer: Buffer.alloc(0) 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/arquivo CSV não pode estar vazio/i);
    });

    it('lança erro quando size está ausente', () => {
        const { size, ...dadosInvalidos } = baseDadosValidos;
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/Required/);
    });

    it('lança erro quando size é zero', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            size: 0 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/tamanho do arquivo deve ser maior que zero/i);
    });

    it('lança erro quando size é negativo', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            size: -100 
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/tamanho do arquivo deve ser maior que zero/i);
    });

    it('lança erro quando size excede o limite máximo (60MB)', () => {
        const dadosInvalidos = { 
            ...baseDadosValidos, 
            size: 61 * 1024 * 1024
        };
        expect(() => fileUploadValidationSchema.parse(dadosInvalidos))
            .toThrowError(/arquivo não pode ser maior que 10MB/i);
    });

    it('aceita arquivo no limite máximo de tamanho', () => {
        const dadosNoLimite = { 
            ...baseDadosValidos, 
            size: 60 * 1024 * 1024
        };
        const resultado = fileUploadValidationSchema.parse(dadosNoLimite);
        expect(resultado.size).toBe(60 * 1024 * 1024);
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

    it('aceita arquivo exportado do Excel como CSV', () => {
        const dadosExcel = {
            ...baseDadosValidos,
            originalname: 'dados_excel_exportados.csv',
            mimetype: 'application/vnd.ms-excel'
        };
        
        const resultado = fileUploadValidationSchema.parse(dadosExcel);
        expect(resultado.mimetype).toBe('application/vnd.ms-excel');
    });
});
