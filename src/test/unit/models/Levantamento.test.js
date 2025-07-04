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

describe('Modelo de Levantamento - Criação (Conforme Schema Mongoose)', () => {
    const baseValidLevantamentoData = () => ({
        inventario: generateValidObjectIdString(),
        bem: {
            id: generateValidObjectIdString(),
            salaId: generateValidObjectIdString(),
            nome: 'Mesa de Escritório',
            tombo: 'TOM123456',
            responsavel: {
                nome: 'João da Silva',
                cpf: '12345678909'
            },
            descricao: 'Mesa de escritório em madeira'
        },
        usuario: generateValidObjectIdString(),
        estado: 'Em condições de uso'
    });

    describe('Casos de sucesso', () => {
        it('deve criar um levantamento com dados válidos e todos os campos obrigatórios', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento).toBeDefined();
            expect(savedLevantamento.inventario.toString()).toBe(levantamentoData.inventario);
            expect(savedLevantamento.bem.id.toString()).toBe(levantamentoData.bem.id);
            expect(savedLevantamento.bem.salaId.toString()).toBe(levantamentoData.bem.salaId);
            expect(savedLevantamento.bem.nome).toBe(levantamentoData.bem.nome);
            expect(savedLevantamento.bem.tombo).toBe(levantamentoData.bem.tombo);
            expect(savedLevantamento.bem.responsavel.nome).toBe(levantamentoData.bem.responsavel.nome);
            expect(savedLevantamento.bem.responsavel.cpf).toBe(levantamentoData.bem.responsavel.cpf);
            expect(savedLevantamento.bem.descricao).toBe(levantamentoData.bem.descricao);
            expect(savedLevantamento.usuario.toString()).toBe(levantamentoData.usuario);
            expect(savedLevantamento.estado).toBe(levantamentoData.estado);
            expect(savedLevantamento.createdAt).toBeDefined();
            expect(savedLevantamento.updatedAt).toBeDefined();
        });

        it('deve criar levantamento com campos opcionais e valores padrão', async () => {
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

        it('deve aplicar valores padrão para campos opcionais quando não fornecidos', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.imagem).toEqual([]);
            expect(savedLevantamento.ocioso).toBe(false);
            expect(savedLevantamento.salaNova).toBeUndefined();
        });

        it('deve aceitar todos os estados válidos do enum', async () => {
            const estados = ['Em condições de uso', 'Inservível', 'Danificado'];
            
            for (const estado of estados) {
                const levantamentoData = {
                    ...baseValidLevantamentoData(),
                    bem: {
                        ...baseValidLevantamentoData().bem,
                        tombo: `TOM${Math.random().toString(36).substr(2, 9)}` // tombo único
                    },
                    estado
                };
                const levantamento = new Levantamento(levantamentoData);
                await levantamento.save();

                const savedLevantamento = await Levantamento.findById(levantamento._id);
                expect(savedLevantamento.estado).toBe(estado);
            }
        });

        it('deve criar levantamento sem salaNova (campo opcional)', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.salaNova).toBeUndefined();
        });

        it('deve permitir array de imagens vazio', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                imagem: []
            };
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.imagem).toEqual([]);
        });
    });

    describe('Casos de erro - Campos obrigatórios', () => {
        it('não deve criar levantamento sem inventario', async () => {
            const { inventario, ...invalidData } = baseValidLevantamentoData();
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Path `inventario` is required/);
        });

        it('não deve criar levantamento sem bem', async () => {
            const { bem, ...invalidData } = baseValidLevantamentoData();
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/bem.id: Path `bem.id` is required/);
        });

        it('não deve criar levantamento sem bem.id', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem
                }
            };
            delete levantamentoData.bem.id;
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.id` is required/);
        });

        it('não deve criar levantamento sem bem.salaId', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem
                }
            };
            delete levantamentoData.bem.salaId;
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.salaId` is required/);
        });

        it('não deve criar levantamento sem bem.nome', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem
                }
            };
            delete levantamentoData.bem.nome;
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.nome` is required/);
        });

        it('não deve criar levantamento sem bem.tombo', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem
                }
            };
            delete levantamentoData.bem.tombo;
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.tombo` is required/);
        });

        it('não deve criar levantamento sem bem.responsavel.nome', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem,
                    responsavel: {
                        cpf: '12345678909'
                    }
                }
            };
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.responsavel.nome` is required/);
        });

        it('não deve criar levantamento sem bem.responsavel.cpf', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem,
                    responsavel: {
                        nome: 'João da Silva'
                    }
                }
            };
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.responsavel.cpf` is required/);
        });

        it('não deve criar levantamento sem bem.descricao', async () => {
            const levantamentoData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem
                }
            };
            delete levantamentoData.bem.descricao;
            const levantamento = new Levantamento(levantamentoData);
            await expect(levantamento.save()).rejects.toThrow(/Path `bem.descricao` is required/);
        });

        it('não deve criar levantamento sem usuario', async () => {
            const { usuario, ...invalidData } = baseValidLevantamentoData();
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Path `usuario` is required/);
        });

        it('não deve criar levantamento sem estado', async () => {
            const { estado, ...invalidData } = baseValidLevantamentoData();
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Path `estado` is required/);
        });
    });

    describe('Casos de erro - Validações de tipo e formato', () => {
        it('não deve criar levantamento com inventario inválido (não ObjectId)', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                inventario: 'not-an-objectid'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
        });

        it('não deve criar levantamento com bem.id inválido (não ObjectId)', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                bem: {
                    ...baseValidLevantamentoData().bem,
                    id: 'not-an-objectid'
                }
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
        });

        it('não deve criar levantamento com salaNova inválida (não ObjectId)', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                salaNova: 'not-an-objectid'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
        });

        it('não deve criar levantamento com usuario inválido (não ObjectId)', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                usuario: 'not-an-objectid'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to ObjectId failed/);
        });

        it('não deve criar levantamento com estado inválido (não no enum)', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                estado: 'Estado Inválido'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Validator failed for path `estado`/);
        });

        it('não deve criar levantamento com ocioso não booleano', async () => {
            const invalidData = {
                ...baseValidLevantamentoData(),
                ocioso: 'not-a-boolean'
            };
            const levantamento = new Levantamento(invalidData);
            await expect(levantamento.save()).rejects.toThrow(/Cast to Boolean failed/);
        });
    });

    describe('Casos de erro - Constraint unique', () => {
        it('não deve permitir levantamentos com bem.tombo duplicado', async () => {
            const levantamentoData1 = baseValidLevantamentoData();
            const levantamentoData2 = {
                ...baseValidLevantamentoData(),
                inventario: generateValidObjectIdString(),
                bem: {
                    ...baseValidLevantamentoData().bem,
                    id: generateValidObjectIdString(),
                    tombo: levantamentoData1.bem.tombo // mesmo tombo
                }
            };

            const levantamento1 = new Levantamento(levantamentoData1);
            const levantamento2 = new Levantamento(levantamentoData2);

            await levantamento1.save();
            await expect(levantamento2.save()).rejects.toThrow(/duplicate key/);
        });
    });

    describe('Funcionalidades do Schema', () => {
        it('deve ter timestamps habilitados', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.createdAt).toBeDefined();
            expect(savedLevantamento.updatedAt).toBeDefined();
            expect(savedLevantamento.createdAt).toBeInstanceOf(Date);
            expect(savedLevantamento.updatedAt).toBeInstanceOf(Date);
        });

        it('não deve ter versionKey (__v)', async () => {
            const levantamentoData = baseValidLevantamentoData();
            const levantamento = new Levantamento(levantamentoData);
            await levantamento.save();

            const savedLevantamento = await Levantamento.findById(levantamento._id);
            expect(savedLevantamento.__v).toBeUndefined();
        });

        it('deve ter plugin de paginação disponível', () => {
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
