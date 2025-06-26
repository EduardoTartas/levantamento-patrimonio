import { InventarioSchema, InventarioUpdateSchema } from '@utils/validators/schemas/zod/InventarioSchema.js'; // Assuming your schema is in InventarioSchema.js

describe('InventarioSchema', () => {
    const baseDadosValidos = {
        campus: "507f191e810c19729de860ea", // Valid MongoDB ObjectId hex string
        nome: 'Inventário Central',
        data: '25/12/2023', // dd/mm/yyyy
    };

    it('analisa dados válidos corretamente (com status explícito)', () => {
        const dadosValidosComStatus = { ...baseDadosValidos, status: false };
        const resultado = InventarioSchema.parse(dadosValidosComStatus);
        expect(resultado.campus).toBe(baseDadosValidos.campus);
        expect(resultado.nome).toBe(baseDadosValidos.nome);
        // Compare with a Date object also created at UTC midnight
        expect(resultado.data).toEqual(new Date(Date.UTC(2023, 11, 25))); // Month is 0-indexed for Date.UTC
        expect(resultado.status).toBe(false);
    });

    it('analisa dados válidos corretamente e define "status" como true por padrão', () => {
        const resultado = InventarioSchema.parse(baseDadosValidos);
        expect(resultado.campus).toBe(baseDadosValidos.campus);
        expect(resultado.nome).toBe(baseDadosValidos.nome);
        expect(resultado.data).toEqual(new Date(Date.UTC(2023, 11, 25))); // Month is 0-indexed
        expect(resultado.status).toBe(true);
    });

    // --- Testes para o campo "campus" ---
    it('lança um erro quando "campus" está ausente (undefined)', () => {
        const { campus, ...dadosInvalidos } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/"path":\s*\[\s*"campus"\s*\]\s*,\s*"message":\s*"Required"/);
    });

    it('lança um erro quando "campus" é inválido (não é um ObjectId válido)', () => {
        const dadosInvalidos = { ...baseDadosValidos, campus: 'id-invalido-123' };
        // This regex depends on your objectIdSchema's actual error message
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Invalid MongoDB ObjectId/);
    });

    // --- Testes para o campo "nome" ---
    it('lança um erro quando "nome" está ausente (undefined)', () => {
        const { nome, ...dadosInvalidos } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/"path":\s*\[\s*"nome"\s*\]\s*,\s*"message":\s*"Required"/);
    });

    it('lança um erro quando "nome" é uma string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, nome: '' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Campo nome é obrigatório./);
    });

    // --- Testes para o campo "data" ---
    it('lança um erro quando "data" está ausente (undefined)', () => {
        const { data, ...dadosInvalidos } = baseDadosValidos;
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/"path":\s*\[\s*"data"\s*\]\s*,\s*"message":\s*"Required"/);
    });

    it('lança um erro quando "data" é uma string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, data: '' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
    });

    it('lança um erro quando "data" não está no formato dd/mm/aaaa', () => {
        const dadosInvalidos = { ...baseDadosValidos, data: '2023-12-25' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
    });

    it('lança um erro quando "data" é um dia inválido para o mês (ex: 31/02)', () => {
        const dadosInvalidos = { ...baseDadosValidos, data: '31/02/2023' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
    });

    it('lança um erro quando "data" é um mês inválido (ex: 25/13/2023)', () => {
        const dadosInvalidos = { ...baseDadosValidos, data: '25/13/2023' };
        expect(() => InventarioSchema.parse(dadosInvalidos)).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
    });
    
    it('transforma "data" em um objeto Date válido e verifica com UTC methods', () => {
        const dados = { ...baseDadosValidos, data: '01/06/2024' }; // June 1st, 2024
        const resultado = InventarioSchema.parse(dados);
        expect(resultado.data).toBeInstanceOf(Date);
        expect(resultado.data.getUTCFullYear()).toBe(2024);
        expect(resultado.data.getUTCMonth()).toBe(5); // 0-indexed (June is 5)
        expect(resultado.data.getUTCDate()).toBe(1);
        expect(resultado.data.getUTCHours()).toBe(0); 
    });
});

describe('InventarioUpdateSchema', () => {
    it('analisa dados parciais corretamente (nome e status padrão)', () => {
        const dadosParciais = { nome: 'Inventário Atualizado' };
        const resultado = InventarioUpdateSchema.parse(dadosParciais);
        expect(resultado.nome).toBe('Inventário Atualizado');
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('aplica status padrão true quando nenhum dado de status é fornecido para atualização e nenhum outro campo é fornecido', () => {
        const resultado = InventarioUpdateSchema.parse({});
        expect(resultado.nome).toBeUndefined();
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('permite atualização de campos específicos, mantendo outros como undefined e status com o valor fornecido', () => {
        const dadosParciais = { data: '15/05/2024', status: false }; // May 15, 2024
        const resultado = InventarioUpdateSchema.parse(dadosParciais);
        expect(resultado.data).toEqual(new Date(Date.UTC(2024, 4, 15))); // Month is 0-indexed
        expect(resultado.status).toBe(false);
        expect(resultado.nome).toBeUndefined();
        expect(resultado.campus).toBeUndefined();
    });

    it('lança um erro quando "nome" for fornecido mas vazio', () => {
        const dadosInvalidos = { nome: '' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Campo nome é obrigatório./);
    });

    it('valida "campus" se fornecido e inválido', () => {
        const dadosInvalidos = { campus: 'id-invalido' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Invalid MongoDB ObjectId/);
    });

    it('valida "data" se fornecida e em formato inválido', () => {
        const dadosInvalidos = { data: '2024-01-01' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Data deve estar no formato dd\/mm\/aaaa/);
    });

    it('valida "data" se fornecida e inválida (dia/mês)', () => {
        const dadosInvalidos = { data: '30/02/2024' };
        expect(() => InventarioUpdateSchema.parse(dadosInvalidos)).toThrow(/Por favor, insira uma data válida no formato dd\/mm\/aaaa/);
    });
    
    it('permite que campos sejam undefined (não atualiza), status defaulta para true', () => {
        const dadosValidos = { nome: 'Nome Novo', campus: undefined, data: undefined, status: undefined };
        const resultado = InventarioUpdateSchema.parse(dadosValidos);
        expect(resultado.nome).toBe('Nome Novo');
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true); 
    });

    it('permite que todos os campos sejam undefined (resultando em um objeto com status default)', () => {
        const dadosValidos = { nome: undefined, campus: undefined, data: undefined, status: undefined };
        const resultado = InventarioUpdateSchema.parse(dadosValidos);
        expect(resultado.nome).toBeUndefined();
        expect(resultado.campus).toBeUndefined();
        expect(resultado.data).toBeUndefined();
        expect(resultado.status).toBe(true);
    });
});