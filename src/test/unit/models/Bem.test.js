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

describe('Modelo de Bem - Criação e Validação', () => {
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

    describe('Criação válida', () => {
        it('deve criar um bem com dados completos', async () => {
            const bemData = { ...baseValidBemData(), auditado: true };
            const bem = new Bem(bemData);
            await bem.save();

            const savedBem = await Bem.findById(bem._id);
            expect(savedBem.nome).toBe(bemData.nome);
            expect(savedBem.tombo).toBe(bemData.tombo);
            expect(savedBem.responsavel.nome).toBe(bemData.responsavel.nome);
            expect(savedBem.responsavel.cpf).toBe(bemData.responsavel.cpf);
            expect(savedBem.valor).toBe(bemData.valor);
            expect(savedBem.auditado).toBe(true);
            expect(savedBem.createdAt).toBeDefined();
            expect(savedBem.updatedAt).toBeDefined();
        });

        it('deve criar um bem com campos opcionais ausentes', async () => {
            const bemData = {
                sala: generateValidObjectIdString(),
                nome: 'Mesa Simples',
                responsavel: { nome: 'Maria Santos' },
                valor: 100.00
            };
            const bem = new Bem(bemData);
            await bem.save();

            const savedBem = await Bem.findById(bem._id);
            expect(savedBem.auditado).toBe(false); // valor padrão
            expect(savedBem.tombo).toBeUndefined();
            expect(savedBem.descricao).toBeUndefined();
            expect(savedBem.responsavel.cpf).toBeUndefined();
        });
    });

    describe('Validação de campos obrigatórios', () => {
        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'sala', error: /Path `sala` is required/ },
                { field: 'nome', error: /Path `nome` is required/ },
                { field: 'responsavel', error: /Path `responsavel.nome` is required/ },
                { field: 'valor', error: /Path `valor` is required/ }
            ];

            for (const { field, error } of testCases) {
                const invalidData = { ...baseValidBemData() };
                delete invalidData[field];
                const bem = new Bem(invalidData);
                await expect(bem.save()).rejects.toThrow(error);
            }
        });

        it('deve falhar com tipos inválidos', async () => {
            const testCases = [
                { field: 'sala', value: 'not-an-objectid', error: /Cast to ObjectId failed/ },
                { field: 'valor', value: 'not-a-number', error: /Cast to Number failed/ },
                { field: 'auditado', value: 'not-a-boolean', error: /Cast to Boolean failed/ }
            ];

            for (const { field, value, error } of testCases) {
                const invalidData = { ...baseValidBemData(), [field]: value };
                const bem = new Bem(invalidData);
                await expect(bem.save()).rejects.toThrow(error);
            }
        });
    });

    describe('Validação de tombo único', () => {
        it('deve permitir múltiplos bens sem tombo', async () => {
            const bemData1 = { ...baseValidBemData() };
            delete bemData1.tombo;
            
            const bemData2 = { ...baseValidBemData(), nome: 'Cadeira de Escritório' };
            delete bemData2.tombo;

            await Bem.create([bemData1, bemData2]);
            const savedBems = await Bem.find({});
            expect(savedBems).toHaveLength(2);
        });

        it('não deve permitir tombos duplicados', async () => {
            const bemData1 = { ...baseValidBemData(), tombo: 'TOM123' };
            const bemData2 = { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM123' };

            await Bem.create(bemData1);
            await expect(Bem.create(bemData2)).rejects.toThrow(/duplicate key/);
        });
    });

    describe('Funcionalidades avançadas', () => {
        it('deve aplicar paginação', async () => {
            const inserts = Array.from({ length: 15 }, (_, i) => ({
                sala: generateValidObjectIdString(),
                nome: `Bem ${i + 1}`,
                responsavel: { nome: `Responsável ${i + 1}` },
                valor: 100 + i
            }));
            await Bem.insertMany(inserts);

            const result = await Bem.paginate({}, { limit: 5, page: 2 });
            expect(result.docs.length).toBe(5);
            expect(result.totalDocs).toBe(15);
            expect(result.totalPages).toBe(3);
        });

        it('deve buscar por nome e tombo', async () => {
            await Bem.create([
                { ...baseValidBemData(), nome: 'Mesa Grande', tombo: 'TOM001' },
                { ...baseValidBemData(), nome: 'Mesa Pequena', tombo: 'TOM002' },
                { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM003' }
            ]);

            const bensComMesa = await Bem.find({ nome: /Mesa/i });
            expect(bensComMesa).toHaveLength(2);

            const bemComTombo = await Bem.findOne({ tombo: 'TOM001' });
            expect(bemComTombo.nome).toBe('Mesa Grande');
        });

        it('deve filtrar por status de auditoria', async () => {
            await Bem.create([
                { ...baseValidBemData(), auditado: true },
                { ...baseValidBemData(), nome: 'Cadeira', tombo: 'TOM456', auditado: false }
            ]);

            const bensAuditados = await Bem.find({ auditado: true });
            const bensNaoAuditados = await Bem.find({ auditado: false });

            expect(bensAuditados).toHaveLength(1);
            expect(bensNaoAuditados).toHaveLength(1);
        });

        it('deve ter índices corretos', async () => {
            const indexes = await Bem.collection.getIndexes();
            const indexNames = Object.keys(indexes);
            
            expect(indexNames.some(key => key.includes('nome'))).toBe(true);
            expect(indexNames.some(key => key.includes('responsavel.cpf'))).toBe(true);
        });

        it('deve atualizar timestamps', async () => {
            const bem = new Bem(baseValidBemData());
            await bem.save();
            
            const initialUpdatedAt = bem.updatedAt;
            await new Promise(resolve => setTimeout(resolve, 100));
            
            bem.nome = 'Mesa Atualizada';
            await bem.save();
            
            expect(bem.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
        });
    });
});
