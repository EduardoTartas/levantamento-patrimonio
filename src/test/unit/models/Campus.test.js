import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Campus from '@models/Campus';

let mongoServer;

beforeAll(async () => {
    // Cria um servidor MongoDB em memória antes dos testes
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

// Desconecta e finaliza o servidor após todos os testes
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// limpa os dados após cada teste
afterEach(async () => {
    await Campus.deleteMany(); 
});

describe('Model Campus', () => {
    it('deve criar e salvar um campus válido com campos obrigatórios', async () => {
        const campusData = {
            nome: 'Campus IFRO',
            cidade: 'Vilhena'
        };

        const campus = new Campus(campusData);
        const savedCampus = await campus.save();

        expect(savedCampus._id).toBeDefined();// Verifica se o documento foi salvo
        expect(savedCampus.nome).toBe('Campus IFRO');
        expect(savedCampus.cidade).toBe('Vilhena');
        expect(savedCampus.status).toBe(true);
    });

    it('deve falhar ao salvar sem o campo obrigatório "nome"', async () => {
        const campusData = {
            cidade: 'Vilhena'
        };

        const campus = new Campus(campusData);
        let error;

        try {
            await campus.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(error.errors.nome).toBeDefined();
    });

    it('deve aplicar paginação corretamente', async () => {
        // Insere 15 registros de campus
        const inserts = [];
        for (let i = 1; i <= 15; i++) {
            inserts.push({ nome: `Campus ${i}`, cidade: 'Cidade' });
        }
        await Campus.insertMany(inserts);

        // Aplica paginação: página 2 com 5 itens por página
        const result = await Campus.paginate({}, { limit: 5, page: 2 });

        expect(result.docs.length).toBe(5);
        expect(result.page).toBe(2);
        expect(result.totalDocs).toBe(15);
        expect(result.totalPages).toBe(3);
    });
});
