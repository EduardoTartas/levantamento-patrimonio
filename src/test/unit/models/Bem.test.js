import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Bem from '@models/Bem';

let mongoServer;

const generateValidObjectIdString = () => new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Bem.createIndexes();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    jest.clearAllMocks();
    await Bem.deleteMany({});
});

describe('Modelo de Bem - Criação (Conforme Schema Mongoose)', () => {
    const baseValidBemData = () => ({
        sala: generateValidObjectIdString(),
        nome: 'Mesa de Escritório',
        tombo: 'TOM123456',
        responsavel: {
            nome: 'João da Silva',
            cpf: '12345678909'
        },
        descricao: 'Mesa de escritório em madeira',
        valor: 250.50,
    });

    it('deve criar um bem com dados válidos e auditado explícito true', async () => {
        const bemData = { ...baseValidBemData(), auditado: true };
        const bem = new Bem(bemData);
        await bem.save();

        const savedBem = await Bem.findById(bem._id);
        expect(savedBem).toBeDefined();
        expect(savedBem.nome).toBe(bemData.nome);
        expect(savedBem.tombo).toBe(bemData.tombo);
        expect(savedBem.responsavel.nome).toBe(bemData.responsavel.nome);
        expect(savedBem.responsavel.cpf).toBe(bemData.responsavel.cpf);
        expect(savedBem.descricao).toBe(bemData.descricao);
        expect(savedBem.valor).toBe(bemData.valor);
        expect(savedBem.auditado).toBe(true);
        expect(savedBem.sala.toString()).toBe(bemData.sala);
        expect(savedBem.createdAt).toBeDefined();
        expect(savedBem.updatedAt).toBeDefined();
    });

    it('deve criar um bem com dados válidos e auditado padrão false (quando auditado não é fornecido)', async () => {
        const bemData = baseValidBemData();
        const bem = new Bem(bemData);
        await bem.save();

        const savedBem = await Bem.findById(bem._id);
        expect(savedBem.auditado).toBe(false);
    });

    it('deve criar um bem sem tombo (campo opcional)', async () => {
        const { tombo, ...bemDataSemTombo } = baseValidBemData();
        const bem = new Bem(bemDataSemTombo);
        await bem.save();

        const savedBem = await Bem.findById(bem._id);
        expect(savedBem).toBeDefined();
        expect(savedBem.tombo).toBeUndefined();
    });

    it('deve criar um bem sem descrição (campo opcional)', async () => {
        const { descricao, ...bemDataSemDescricao } = baseValidBemData();
        const bem = new Bem(bemDataSemDescricao);
        await bem.save();

        const savedBem = await Bem.findById(bem._id);
        expect(savedBem).toBeDefined();
        expect(savedBem.descricao).toBeUndefined();
    });

    it('deve criar um bem sem CPF do responsável (campo opcional)', async () => {
        const bemData = {
            ...baseValidBemData(),
            responsavel: {
                nome: 'Maria Santos'
            }
        };
        const bem = new Bem(bemData);
        await bem.save();

        const savedBem = await Bem.findById(bem._id);
        expect(savedBem).toBeDefined();
        expect(savedBem.responsavel.nome).toBe('Maria Santos');
        expect(savedBem.responsavel.cpf).toBeUndefined();
    });

    it('não deve criar um bem sem sala', async () => {
        const { sala, ...invalidData } = baseValidBemData();
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `sala` is required/);
    });

    it('não deve criar um bem sem nome', async () => {
        const { nome, ...invalidData } = baseValidBemData();
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `nome` is required/);
    });

    it('não deve criar um bem com nome vazio', async () => {
        const invalidData = { ...baseValidBemData(), nome: '' };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `nome` is required/);
    });

    it('não deve criar um bem sem responsável', async () => {
        const { responsavel, ...invalidData } = baseValidBemData();
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `responsavel.nome` is required/);
    });

    it('não deve criar um bem sem nome do responsável', async () => {
        const invalidData = {
            ...baseValidBemData(),
            responsavel: { cpf: '12345678909' }
        };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `responsavel.nome` is required/);
    });

    it('não deve criar um bem com nome do responsável vazio', async () => {
        const invalidData = {
            ...baseValidBemData(),
            responsavel: { nome: '', cpf: '12345678909' }
        };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `responsavel.nome` is required/);
    });

    it('não deve criar um bem sem valor', async () => {
        const { valor, ...invalidData } = baseValidBemData();
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Path `valor` is required/);
    });

    it('não deve criar um bem com sala inválida (não ObjectId)', async () => {
        const invalidData = { ...baseValidBemData(), sala: 'not-an-objectid' };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Cast to ObjectId failed/);
    });

    it('não deve criar um bem com valor não numérico', async () => {
        const invalidData = { ...baseValidBemData(), valor: 'not-a-number' };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Cast to Number failed/);
    });

    it('não deve criar um bem com auditado não booleano', async () => {
        const invalidData = { ...baseValidBemData(), auditado: 'not-a-boolean' };
        const bem = new Bem(invalidData);
        await expect(bem.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('deve permitir múltiplos bens sem tombo', async () => {
        const bemData1 = { ...baseValidBemData() };
        delete bemData1.tombo;
        
        const bemData2 = { ...baseValidBemData(), nome: 'Cadeira de Escritório' };
        delete bemData2.tombo;

        const bem1 = new Bem(bemData1);
        const bem2 = new Bem(bemData2);

        await bem1.save();
        await bem2.save();

        const savedBems = await Bem.find({});
        expect(savedBems).toHaveLength(2);
    });

    it('não deve permitir bens com tombo vazio duplicado (devido ao índice sparse)', async () => {
        const bemData1 = { ...baseValidBemData(), tombo: '' };
        const bemData2 = { ...baseValidBemData(), nome: 'Cadeira de Escritório', tombo: '' };

        const bem1 = new Bem(bemData1);
        const bem2 = new Bem(bemData2);

        await bem1.save();
        await expect(bem2.save()).rejects.toThrow(/duplicate key/);
    });

    it('deve permitir bens com tombo apenas com espaços (função unique)', async () => {
        const bemData1 = { ...baseValidBemData(), tombo: '   ' };
        const bemData2 = { ...baseValidBemData(), nome: 'Cadeira de Escritório', tombo: '  ' };

        const bem1 = new Bem(bemData1);
        const bem2 = new Bem(bemData2);

        await bem1.save();
        await bem2.save();

        const savedBems = await Bem.find({ tombo: { $exists: true } });
        expect(savedBems).toHaveLength(2);
    });

    it('não deve permitir bens com mesmo tombo não vazio', async () => {
        const bemData1 = { ...baseValidBemData(), tombo: 'TOM123' };
        const bemData2 = { ...baseValidBemData(), nome: 'Cadeira de Escritório', tombo: 'TOM123' };

        const bem1 = new Bem(bemData1);
        const bem2 = new Bem(bemData2);

        await bem1.save();
        await expect(bem2.save()).rejects.toThrow(/duplicate key/);
    });

    it('deve criar índice no campo nome', async () => {
        const indexes = await Bem.collection.getIndexes();
        const nomeIndex = Object.keys(indexes).find(key => key.includes('nome'));
        expect(nomeIndex).toBeDefined();
    });

    it('deve criar índice no campo responsavel.cpf', async () => {
        const indexes = await Bem.collection.getIndexes();
        const cpfIndex = Object.keys(indexes).find(key => key.includes('responsavel.cpf'));
        expect(cpfIndex).toBeDefined();
    });

    it('deve aplicar paginação corretamente', async () => {
        const inserts = [];
        for (let i = 1; i <= 15; i++) {
            inserts.push({
                sala: generateValidObjectIdString(),
                nome: `Bem ${i}`,
                responsavel: { nome: `Responsável ${i}` },
                valor: 100 + i
            });
        }
        await Bem.insertMany(inserts);

        const result = await Bem.paginate({}, { limit: 5, page: 2 });

        expect(result.docs.length).toBe(5);
        expect(result.page).toBe(2);
        expect(result.totalDocs).toBe(15);
        expect(result.totalPages).toBe(3);
    });

    it('deve encontrar bens por nome usando índice', async () => {
        await Bem.create([
            { ...baseValidBemData(), nome: 'Mesa Grande' },
            { ...baseValidBemData(), nome: 'Mesa Pequena', tombo: 'TOM456' },
            { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM789' }
        ]);

        const bensComMesa = await Bem.find({ nome: /Mesa/i });
        expect(bensComMesa).toHaveLength(2);
    });

    it('deve encontrar bens por tombo', async () => {
        await Bem.create([
            { ...baseValidBemData(), tombo: 'TOM123' },
            { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM456' }
        ]);

        const bemComTombo = await Bem.findOne({ tombo: 'TOM123' });
        expect(bemComTombo).toBeDefined();
        expect(bemComTombo.nome).toBe('Mesa de Escritório');
    });

    it('deve encontrar bens por status de auditoria', async () => {
        await Bem.create([
            { ...baseValidBemData(), auditado: true },
            { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM456', auditado: false }
        ]);

        const bensAuditados = await Bem.find({ auditado: true });
        const bensNaoAuditados = await Bem.find({ auditado: false });

        expect(bensAuditados).toHaveLength(1);
        expect(bensNaoAuditados).toHaveLength(1);
    });

    it('deve ter timestamps createdAt e updatedAt', async () => {
        const bem = new Bem(baseValidBemData());
        await bem.save();

        expect(bem.createdAt).toBeDefined();
        expect(bem.updatedAt).toBeDefined();
        expect(bem.createdAt).toBeInstanceOf(Date);
        expect(bem.updatedAt).toBeInstanceOf(Date);
    });

    it('deve atualizar updatedAt quando o documento é modificado', async () => {
        const bem = new Bem(baseValidBemData());
        await bem.save();
        
        const initialUpdatedAt = bem.updatedAt;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        bem.nome = 'Mesa Atualizada';
        await bem.save();
        
        expect(bem.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
});
