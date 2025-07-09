import Rota from '@models/Rota.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Rota.createIndexes();
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}, 30000);

afterEach(async () => {
    jest.clearAllMocks();
    await Rota.deleteMany({});
});

describe('Modelo Rota', () => {
    const baseValidRotaData = () => ({
        rota: '/api/teste',
        dominio: 'usuario'
    });

    describe('Criação e validação', () => {
        it('deve criar rota com dados válidos', async () => {
            const rotaData = baseValidRotaData();
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.rota).toBe(rotaData.rota);
            expect(savedRota.dominio).toBe(rotaData.dominio);
            expect(savedRota.ativo).toBe(true); // valor padrão
            expect(savedRota.buscar).toBe(false); // valor padrão
            expect(savedRota.enviar).toBe(false); // valor padrão
            expect(savedRota.substituir).toBe(false); // valor padrão
            expect(savedRota.modificar).toBe(false); // valor padrão
            expect(savedRota.excluir).toBe(false); // valor padrão
        });

        it('deve criar rota com todas as permissões', async () => {
            const rotaData = {
                ...baseValidRotaData(),
                ativo: false,
                buscar: true,
                enviar: true,
                substituir: true,
                modificar: true,
                excluir: true
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.ativo).toBe(false);
            expect(savedRota.buscar).toBe(true);
            expect(savedRota.enviar).toBe(true);
            expect(savedRota.substituir).toBe(true);
            expect(savedRota.modificar).toBe(true);
            expect(savedRota.excluir).toBe(true);
        });

        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'rota', error: /Path `rota` is required/ },
                { field: 'dominio', error: /Path `dominio` is required/ }
            ];

            for (const { field, error } of testCases) {
                const invalidData = { ...baseValidRotaData() };
                delete invalidData[field];
                const rota = new Rota(invalidData);
                await expect(rota.save()).rejects.toThrow(error);
            }
        });

        it('deve falhar com campos obrigatórios vazios', async () => {
            const testCases = [
                { field: 'rota', value: '' },
                { field: 'dominio', value: '' }
            ];

            for (const { field, value } of testCases) {
                const invalidData = { ...baseValidRotaData(), [field]: value };
                const rota = new Rota(invalidData);
                await expect(rota.save()).rejects.toThrow(/is required/);
            }
        });
    });

    describe('Validação de tipos', () => {
        it('deve converter tipos válidos para string', async () => {
            const rotaData = {
                rota: 123,
                dominio: 456
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.rota).toBe('123');
            expect(savedRota.dominio).toBe('456');
        });

        it('deve falhar com tipos inválidos para boolean', async () => {
            const booleanFields = ['ativo', 'buscar', 'enviar', 'substituir', 'modificar', 'excluir'];

            for (const field of booleanFields) {
                const invalidData = { ...baseValidRotaData(), [field]: 'sim' };
                const rota = new Rota(invalidData);
                await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
            }
        });

        it('deve converter tipos válidos para boolean', async () => {
            const rotaData = {
                ...baseValidRotaData(),
                ativo: 'true',
                buscar: 'false',
                enviar: 1,
                substituir: 0
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.ativo).toBe(true);
            expect(savedRota.buscar).toBe(false);
            expect(savedRota.enviar).toBe(true);
            expect(savedRota.substituir).toBe(false);
        });
    });

    describe('Operações CRUD', () => {
        it('deve atualizar rota', async () => {
            const rotaData = baseValidRotaData();
            const rota = new Rota(rotaData);
            await rota.save();

            const updateData = {
                rota: '/api/atualizada',
                dominio: 'admin',
                ativo: false,
                buscar: true,
                enviar: true
            };

            await Rota.findByIdAndUpdate(rota._id, updateData);
            const updatedRota = await Rota.findById(rota._id);

            expect(updatedRota.rota).toBe(updateData.rota);
            expect(updatedRota.dominio).toBe(updateData.dominio);
            expect(updatedRota.ativo).toBe(false);
            expect(updatedRota.buscar).toBe(true);
            expect(updatedRota.enviar).toBe(true);
        });

        it('deve remover rota', async () => {
            const rotaData = baseValidRotaData();
            const rota = new Rota(rotaData);
            await rota.save();

            await Rota.findByIdAndDelete(rota._id);
            const deletedRota = await Rota.findById(rota._id);
            expect(deletedRota).toBeNull();
        });

        it('deve buscar rotas por critérios', async () => {
            await Rota.create([
                { rota: '/api/rota1', dominio: 'usuario', buscar: true },
                { rota: '/api/rota2', dominio: 'admin', buscar: false },
                { rota: '/api/rota3', dominio: 'usuario', buscar: true }
            ]);

            const rotasUsuario = await Rota.find({ dominio: 'usuario' });
            expect(rotasUsuario).toHaveLength(2);

            const rotasComBuscar = await Rota.find({ buscar: true });
            expect(rotasComBuscar).toHaveLength(2);

            const rotasUsuarioComBuscar = await Rota.find({ dominio: 'usuario', buscar: true });
            expect(rotasUsuarioComBuscar).toHaveLength(2);
        });
    });

    describe('Casos especiais', () => {
        it('deve aceitar strings longas', async () => {
            const longString = 'a'.repeat(1000);
            const rotaData = {
                rota: longString,
                dominio: 'b'.repeat(1000)
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.rota).toBe(longString);
            expect(savedRota.dominio).toBe(rotaData.dominio);
        });

        it('deve aceitar caracteres especiais', async () => {
            const rotaData = {
                rota: '/api/test!@#$%^&*()_+-=[]{}|;:,.<>?',
                dominio: 'domínio-com-acentos-çñü'
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.rota).toBe(rotaData.rota);
            expect(savedRota.dominio).toBe(rotaData.dominio);
        });

        it('deve ignorar campos extras', async () => {
            const rotaData = {
                ...baseValidRotaData(),
                campoExtra: 'valor extra',
                outroExtra: 123
            };
            const rota = new Rota(rotaData);
            await rota.save();

            const savedRota = await Rota.findById(rota._id);
            expect(savedRota.campoExtra).toBeUndefined();
            expect(savedRota.outroExtra).toBeUndefined();
        });

        it('deve manter consistência após múltiplas operações', async () => {
            const rotaData = baseValidRotaData();
            const rota = new Rota(rotaData);
            await rota.save();

            // Primeira atualização
            await Rota.findByIdAndUpdate(rota._id, { ativo: false });
            let updatedRota = await Rota.findById(rota._id);
            expect(updatedRota.ativo).toBe(false);

            // Segunda atualização
            await Rota.findByIdAndUpdate(rota._id, { buscar: true, enviar: true });
            updatedRota = await Rota.findById(rota._id);
            expect(updatedRota.ativo).toBe(false); // deve manter valor anterior
            expect(updatedRota.buscar).toBe(true);
            expect(updatedRota.enviar).toBe(true);
        });
    });
});