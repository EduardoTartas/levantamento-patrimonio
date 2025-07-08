import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Campus from '@models/Campus';

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

afterEach(async () => {
    await Campus.deleteMany();
});

describe('Modelo Campus', () => {
    const validCampusData = () => ({
        nome: 'Campus IFRO',
        cidade: 'Vilhena',
        telefone: '(69) 3322-8400',
        bairro: 'Centro',
        rua: 'Rua das Flores',
        numeroResidencia: '123'
    });

    describe('Criação e validação', () => {
        it('deve criar campus com dados válidos', async () => {
            const campusData = validCampusData();
            const campus = new Campus(campusData);
            const savedCampus = await campus.save();

            expect(savedCampus._id).toBeDefined();
            expect(savedCampus.nome).toBe(campusData.nome);
            expect(savedCampus.cidade).toBe(campusData.cidade);
            expect(savedCampus.telefone).toBe(campusData.telefone);
            expect(savedCampus.status).toBe(true); // valor padrão
            expect(savedCampus.createdAt).toBeDefined();
            expect(savedCampus.updatedAt).toBeDefined();
        });

        it('deve criar campus apenas com campos obrigatórios', async () => {
            const campusData = {
                nome: 'Campus Simples',
                cidade: 'Porto Velho'
            };

            const campus = new Campus(campusData);
            const savedCampus = await campus.save();

            expect(savedCampus.nome).toBe(campusData.nome);
            expect(savedCampus.cidade).toBe(campusData.cidade);
            expect(savedCampus.status).toBe(true);
            expect(savedCampus.telefone).toBeUndefined();
        });

        it('deve falhar sem campos obrigatórios', async () => {
            const testCases = [
                { field: 'nome', data: { cidade: 'Vilhena' } },
                { field: 'cidade', data: { nome: 'Campus Test' } }
            ];

            for (const { field, data } of testCases) {
                const campus = new Campus(data);
                await expect(campus.save()).rejects.toThrow(mongoose.Error.ValidationError);
            }
        });

        it('deve aceitar status personalizado', async () => {
            const campusData = {
                ...validCampusData(),
                status: false
            };

            const campus = new Campus(campusData);
            const savedCampus = await campus.save();

            expect(savedCampus.status).toBe(false);
        });
    });

    describe('Funcionalidades avançadas', () => {
        it('deve aplicar paginação', async () => {
            const inserts = Array.from({ length: 12 }, (_, i) => ({
                nome: `Campus ${i + 1}`,
                cidade: 'Cidade Test'
            }));
            await Campus.insertMany(inserts);

            const result = await Campus.paginate({}, { limit: 5, page: 2 });

            expect(result.docs.length).toBe(5);
            expect(result.page).toBe(2);
            expect(result.totalDocs).toBe(12);
            expect(result.totalPages).toBe(3);
        });

        it('deve buscar por nome e cidade', async () => {
            await Campus.create([
                { nome: 'Campus Norte', cidade: 'Ariquemes' },
                { nome: 'Campus Sul', cidade: 'Vilhena' },
                { nome: 'Campus Central', cidade: 'Porto Velho' }
            ]);

            const campusVilhena = await Campus.findOne({ cidade: 'Vilhena' });
            expect(campusVilhena.nome).toBe('Campus Sul');

            const campusComNome = await Campus.find({ nome: /Campus/i });
            expect(campusComNome).toHaveLength(3);
        });

        it('deve filtrar por status', async () => {
            await Campus.create([
                { nome: 'Campus Ativo', cidade: 'Ariquemes', status: true },
                { nome: 'Campus Inativo', cidade: 'Vilhena', status: false }
            ]);

            const campusAtivos = await Campus.find({ status: true });
            const campusInativos = await Campus.find({ status: false });

            expect(campusAtivos).toHaveLength(1);
            expect(campusInativos).toHaveLength(1);
        });
    });
});
