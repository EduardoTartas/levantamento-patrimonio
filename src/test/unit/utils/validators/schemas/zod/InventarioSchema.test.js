import { InventarioSchema, InventarioUpdateSchema } from '@utils/validators/schemas/zod/InventarioSchema.js';

describe('InventarioSchema', () => {
    const baseDadosValidos = {
        campus: "507f191e810c19729de860ea",
        nome: 'Inventário Central',
        data: '25/12/2023',
    };

    it('analisa dados válidos corretamente com status explícito', () => {
        const dadosValidosComStatus = { ...baseDadosValidos, status: false };
        const resultado = InventarioSchema.parse(dadosValidosComStatus);
        expect(resultado.campus).toBe(baseDadosValidos.campus);
        expect(resultado.nome).toBe(baseDadosValidos.nome);
        expect(resultado.data).toEqual(new Date(Date.UTC(2023, 11, 25)));
        expect(resultado.status).toBe(false);
    });

    it('analisa dados válidos corretamente e define status como true por padrão', () => {
        const resultado = InventarioSchema.parse(baseDadosValidos);
        expect(resultado.campus).toBe(baseDadosValidos.campus);
        expect(resultado.nome).toBe(baseDadosValidos.nome);
        expect(resultado.data).toEqual(new Date(Date.UTC(2023, 11, 25)));
        expect(resultado.status).toBe(true);
    });

    it('transforma data em um objeto Date válido', () => {
        const dados = { ...baseDadosValidos, data: '01/06/2024' };
        const resultado = InventarioSchema.parse(dados);
        expect(resultado.data).toBeInstanceOf(Date);
        expect(resultado.data.getUTCFullYear()).toBe(2024);
        expect(resultado.data.getUTCMonth()).toBe(5);
        expect(resultado.data.getUTCDate()).toBe(1);
        expect(resultado.data.getUTCHours()).toBe(0); 
    });

    it('falha para campos obrigatórios ausentes', () => {
        const { campus, ...dadosInvalidos } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/"path":\s*\[\s*"campus"\s*\]\s*,\s*"message":\s*"Required"/);
        
        const { nome, ...dadosInvalidos2 } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos2)).toThrow(/"path":\s*\[\s*"nome"\s*\]\s*,\s*"message":\s*"Required"/);
        
        const { data, ...dadosInvalidos3 } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos3)).toThrow(/"path":\s*\[\s*"data"\s*\]\s*,\s*"message":\s*"Required"/);
    });

    it('falha para campus inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, campus: 'id-invalido-123' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Invalid MongoDB ObjectId/);
    });

    it('falha para nome vazio', () => {
        const dadosInvalidos = { ...baseDadosValidos, nome: '' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Campo nome é obrigatório./);
    });

    it('falha para data inválida', () => {
        expect(() => InventarioSchema.parse({ ...baseDadosValidos, data: '' })).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
        expect(() => InventarioSchema.parse({ ...baseDadosValidos, data: '2023-12-25' })).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
        expect(() => InventarioSchema.parse({ ...baseDadosValidos, data: '31/02/2023' })).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
        expect(() => InventarioSchema.parse({ ...baseDadosValidos, data: '25/13/2023' })).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
    });
});

describe('InventarioUpdateSchema', () => {
    it('analisa dados parciais corretamente com status padrão', () => {
        const dadosParciais = { nome: 'Inventário Atualizado' };
        const resultado = InventarioUpdateSchema.parse(dadosParciais);
        expect(resultado.nome).toBe('Inventário Atualizado');
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('aplica status padrão true quando nenhum dado é fornecido', () => {
        const resultado = InventarioUpdateSchema.parse({});
        expect(resultado.nome).toBeUndefined();
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('permite atualização de campos específicos', () => {
        const dadosParciais = { data: '15/05/2024', status: false };
        const resultado = InventarioUpdateSchema.parse(dadosParciais);
        expect(resultado.data).toEqual(new Date(Date.UTC(2024, 4, 15)));
        expect(resultado.status).toBe(false);
        expect(resultado.nome).toBeUndefined();
        expect(resultado.campus).toBeUndefined();
    });

    it('permite campos undefined e aplica status padrão', () => {
        const dadosValidos = { nome: 'Nome Novo', campus: undefined, data: undefined, status: undefined };
        const resultado = InventarioUpdateSchema.parse(dadosValidos);
        expect(resultado.nome).toBe('Nome Novo');
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true); 
    });

    it('falha para nome vazio', () => {
        const dadosInvalidos = { nome: '' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Campo nome é obrigatório./);
    });

    it('falha para campus inválido', () => {
        const dadosInvalidos = { campus: 'id-invalido' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Invalid MongoDB ObjectId/);
    });

    it('falha para data inválida', () => {
        expect(() => InventarioUpdateSchema.parse({ data: '2024-01-01' })).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
        expect(() => InventarioUpdateSchema.parse({ data: '30/02/2024' })).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
    });
});