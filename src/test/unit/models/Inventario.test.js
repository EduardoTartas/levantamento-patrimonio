import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import InventarioModel from '@models/Inventario';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await InventarioModel.deleteMany({});
});

describe('Modelo Inventario', () => {
    const mockCampusId = new mongoose.Types.ObjectId();

    const validInventarioData = () => ({
        campus: mockCampusId,
        nome: 'Inventário Principal',
        data: new Date('2024-01-01'),
    });

    describe('Criação e validação', () => {
        it('deve criar inventário com dados válidos', async () => {
            const inventarioData = validInventarioData();
            const inventario = new InventarioModel(inventarioData);
            const savedInventario = await inventario.save();

            expect(savedInventario._id).toBeDefined();
            expect(savedInventario.campus.toString()).toBe(mockCampusId.toString());
            expect(savedInventario.nome).toBe(inventarioData.nome);
            expect(savedInventario.data).toEqual(inventarioData.data);
            expect(savedInventario.status).toBe(true); // valor padrão
            expect(savedInventario.createdAt).toBeDefined();
            expect(savedInventario.updatedAt).toBeDefined();
            expect(savedInventario.__v).toBeUndefined(); // sem versionKey
        });

        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'campus', error: /Path `campus` is required/ },
                { field: 'nome', error: /Path `nome` is required/ },
                { field: 'data', error: /Path `data` is required/ }
            ];

            for (const { field, error } of testCases) {
                const invalidData = { ...validInventarioData() };
                delete invalidData[field];
                const inventario = new InventarioModel(invalidData);
                await expect(inventario.save()).rejects.toThrow(error);
            }
        });

        it('deve falhar com tipos inválidos', async () => {
            const testCases = [
                { field: 'campus', value: 'id-invalido', error: /Cast to ObjectId failed/ },
                { field: 'data', value: 'data-invalida', error: /Cast to date failed/ }
            ];

            for (const { field, value, error } of testCases) {
                const invalidData = { ...validInventarioData(), [field]: value };
                const inventario = new InventarioModel(invalidData);
                await expect(inventario.save()).rejects.toThrow(error);
            }
        });

        it('deve aceitar status personalizado', async () => {
            const inventarioData = {
                ...validInventarioData(),
                status: false
            };

            const inventario = new InventarioModel(inventarioData);
            const savedInventario = await inventario.save();

            expect(savedInventario.status).toBe(false);
        });

        it('deve ter índice no campo nome', () => {
            const schemaPaths = InventarioModel.schema.paths;
            expect(schemaPaths.nome.options.index).toBe(true);
        });
    });

    describe('Operações CRUD', () => {
        let inventarioExistente;

        beforeEach(async () => {
            inventarioExistente = await InventarioModel.create({
                campus: mockCampusId,
                nome: 'Inventário Existente',
                data: new Date('2023-01-01'),
                status: true
            });
        });

        it('deve listar inventários', async () => {
            await InventarioModel.create([
                { campus: mockCampusId, nome: 'Inventário A', data: new Date(), status: true },
                { campus: new mongoose.Types.ObjectId(), nome: 'Inventário B', data: new Date(), status: false }
            ]);

            const inventarios = await InventarioModel.find({});
            expect(inventarios.length).toBe(3); // incluindo o do beforeEach
        });

        it('deve atualizar inventário', async () => {
            const novoCampusId = new mongoose.Types.ObjectId();
            const updates = {
                nome: 'Inventário Atualizado',
                status: false,
                data: new Date('2024-01-01'),
                campus: novoCampusId
            };

            const inventarioAtualizado = await InventarioModel.findByIdAndUpdate(
                inventarioExistente._id,
                updates,
                { new: true }
            );

            expect(inventarioAtualizado.nome).toBe(updates.nome);
            expect(inventarioAtualizado.status).toBe(updates.status);
            expect(inventarioAtualizado.campus.toString()).toBe(novoCampusId.toString());
            expect(inventarioAtualizado.updatedAt.getTime()).toBeGreaterThan(inventarioExistente.updatedAt.getTime());
        });

        it('deve remover inventário', async () => {
            const result = await InventarioModel.deleteOne({ _id: inventarioExistente._id });
            expect(result.deletedCount).toBe(1);

            const inventarioEncontrado = await InventarioModel.findById(inventarioExistente._id);
            expect(inventarioEncontrado).toBeNull();
        });

        it('deve funcionar com findByIdAndDelete', async () => {
            const removedDoc = await InventarioModel.findByIdAndDelete(inventarioExistente._id);
            expect(removedDoc._id.toString()).toBe(inventarioExistente._id.toString());

            const inventarioEncontrado = await InventarioModel.findById(inventarioExistente._id);
            expect(inventarioEncontrado).toBeNull();

            const nonExistentId = new mongoose.Types.ObjectId();
            const removedNonExistentDoc = await InventarioModel.findByIdAndDelete(nonExistentId);
            expect(removedNonExistentDoc).toBeNull();
        });
    });

    describe('Funcionalidades avançadas', () => {
        it('deve aplicar paginação', async () => {
            const inserts = Array.from({ length: 10 }, (_, i) => ({
                campus: mockCampusId,
                nome: `Inventário ${i + 1}`,
                data: new Date()
            }));
            await InventarioModel.insertMany(inserts);

            const options = { page: 1, limit: 3, sort: { nome: 1 } };
            const result = await InventarioModel.paginate({}, options);

            expect(result.docs.length).toBe(3);
            expect(result.totalDocs).toBe(10);
            expect(result.limit).toBe(3);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(4);
        });

        it('deve buscar e filtrar inventários', async () => {
            const campus2 = new mongoose.Types.ObjectId();
            await InventarioModel.create([
                { campus: mockCampusId, nome: 'Inventário Campus 1', data: new Date(), status: true },
                { campus: campus2, nome: 'Inventário Campus 2', data: new Date(), status: false }
            ]);

            const inventariosPorCampus = await InventarioModel.find({ campus: mockCampusId });
            expect(inventariosPorCampus.length).toBe(1);

            const inventariosAtivos = await InventarioModel.find({ status: true });
            const inventariosInativos = await InventarioModel.find({ status: false });
            expect(inventariosAtivos.length).toBe(1);
            expect(inventariosInativos.length).toBe(1);
        });
    });
});