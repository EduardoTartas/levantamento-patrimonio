import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Levantamento from '@models/Levantamento.js';

let mongoServer;

const generateValidObjectIdString = () => new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Levantamento.createIndexes();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Levantamento.deleteMany({});
});

describe('Modelo Levantamento', () => {
    const baseValidLevantamentoData = () => ({
        inventario: generateValidObjectIdString(),
        bem: {
            id: generateValidObjectIdString(),
            salaId: generateValidObjectIdString(),
            nome: 'Mesa de Escritório',
            tombo: `TOM${Math.random().toString(36).substr(2, 9)}`,
            responsavel: {
                nome: 'João da Silva',
                cpf: '12345678909'
            },
            descricao: 'Mesa de escritório em madeira'
        },
        usuario: generateValidObjectIdString(),
        estado: 'Em condições de uso'
    });

    describe('Criação e validação', () => {
        it('deve criar levantamento com dados válidos', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.inventario.toString()).toBe(levantamentoData.inventario);
            expect(savedLevantamento.bem.id.toString()).toBe(levantamentoData.bem.id);
            expect(savedLevantamento.bem.nome).toBe(levantamentoData.bem.nome);
            expect(savedLevantamento.bem.tombo).toBe(levantamentoData.bem.tombo);
            expect(savedLevantamento.bem.responsavel.nome).toBe(levantamentoData.bem.responsavel.nome);
            expect(savedLevantamento.bem.responsavel.cpf).toBe(levantamentoData.bem.responsavel.cpf);
            expect(savedLevantamento.usuario.toString()).toBe(levantamentoData.usuario);
            expect(savedLevantamento.estado).toBe(levantamentoData.estado);
            expect(savedLevantamento.createdAt).toBeDefined();
            expect(savedLevantamento.updatedAt).toBeDefined();
        });

        it('deve criar levantamento com campos opcionais', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                salaNova: generateValidObjectIdString(),
                imagem: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
                ocioso: true
            };
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.salaNova.toString()).toBe(levantamentoData.salaNova);
            expect(savedLevantamento.imagem).toEqual(levantamentoData.imagem);
            expect(savedLevantamento.ocioso).toBe(true);
        });

        it('deve aplicar valores padrão', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.imagem).toEqual([]);
            expect(savedLevantamento.ocioso).toBe(false);
            expect(savedLevantamento.salaNova).toBeUndefined();
        });

        it('deve aceitar todos os estados válidos', async () => {
            const estados = ['Em condições de uso', 'Inservível', 'Danificado'];
            
            for (const estado of estados) {
                const levantamentoData = {
                    ...baseValidLevantamentoData(),
                    estado
                };
                const levantamento = new Levantamento(levantamentoData);
                await levantamento.save();

                const savedLevantamento = await Levantamento.findById(levantamento._id);
                expect(savedLevantamento.estado).toBe(estado);
            }
        });
    });

    describe('Validação de campos obrigatórios', () => {
        it('deve falhar sem campos obrigatórios principais', async () => {
            const testCases = [
                { field: 'inventario', error: /Path `inventario` is required/ },
                { field: 'usuario', error: /Path `usuario` is required/ },
                { field: 'estado', error: /Path `estado` is required/ }
            ];

            for (const { field, error } of testCases) {
                const invalidData = { ...baseValidLevantamentoData() };
                delete invalidData[field];
                const levantamento = new Levantamento(invalidData);
                await expect(levantamento.save()).rejects.toThrow(error);
            }
        });

        it('deve falhar sem campos obrigatórios do bem', async () => {
            const bemFields = ['id', 'salaId', 'nome', 'tombo', 'descricao'];
            const bemResponsavelFields = ['nome', 'cpf'];

            // Teste campos diretos do bem
            for (const field of bemFields) {
                const invalidData = { ...baseValidLevantamentoData() };
                delete invalidData.bem[field];
                const levantamento = new Levantamento(invalidData);
                await expect(levantamento.save()).rejects.toThrow(new RegExp(`Path \`bem.${field}\` is required`));
            }

            // Teste campos do responsável
            for (const field of bemResponsavelFields) {
                const invalidData = { ...baseValidLevantamentoData() };
                delete invalidData.bem.responsavel[field];
                const levantamento = new Levantamento(invalidData);
                await expect(levantamento.save()).rejects.toThrow(new RegExp(`Path \`bem.responsavel.${field}\` is required`));
            }
        });
    });

    describe('Validação de tipos e formatos', () => {
        it('deve falhar com ObjectIds inválidos', async () => {
            const testCases = [
                { field: 'inventario', value: 'not-an-objectid' },
                { field: 'usuario', value: 'not-an-objectid' },
                { field: 'salaNova', value: 'not-an-objectid' }
            ];

            for (const { field, value } of testCases) {
                const invalidData = { ...baseValidLevantamentoData(), [field]: value };
                const levantamento = new Levantamento(invalidData);
                await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
            }
        });

        it('deve falhar com bem.id e bem.salaId inválidos', async () => {
            const testCases = [
                { field: 'id', value: 'not-an-objectid' },
                { field: 'salaId', value: 'not-an-objectid' }
            ];

            for (const { field, value } of testCases) {
                const invalidData = { ...baseValidLevantamentoData() };
                invalidData.bem[field] = value;
                const levantamento = new Levantamento(invalidData);
                await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
            }
        });

        it('deve falhar com estado inválido', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                estado: 'Estado Inválido'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Validator failed for path `estado`/);
        });

        it('deve falhar com ocioso não booleano', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                ocioso: 'not-a-boolean'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to Boolean failed/);
        });
    });

    describe('Restrições únicas', () => {
        it('não deve permitir tombo duplicado', async () => {
            const tombo = 'TOM123456';
            const levantamentoData1 = {
                ...baseValidLevantamentoData(),
                bem: { ...baseValidLevantamentoData().bem, tombo }
            };
            const levantamentoData2 = {
                ...baseValidLevantamentoData(),
                inventario: generateValidObjectIdString(),
                bem: { ...baseValidLevantamentoData().bem, id: generateValidObjectIdString(), tombo }
            };

            await Levantamento.create(levantamentoData1);
            await expect(Levantamento.create(levantamentoData2)).rejects.toThrow(/duplicate key/);
        });
    });

    describe('Funcionalidades do schema', () => {
        it('deve ter timestamps e não ter versionKey', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.createdAt).toBeInstanceOf(Date);
            expect(savedLevantamento.updatedAt).toBeInstanceOf(Date);
            expect(savedLevantamento.__v).toBeUndefined();
        });

        it('deve ter plugin de paginação', () => {
            expect(typeof Levantamento.paginate).toBe('function');
        });

        it('deve ter índice no campo bem.nome', async () => {
            const indexes = await Levantamento.collection.getIndexes();
            const hasNomeIndex = Object.keys(indexes).some(key => 
                indexes[key].some(index => index[0] === 'bem.nome')
            );
            expect(hasNomeIndex).toBe(true);
        });
    });
});
