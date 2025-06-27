import mongoose from 'mongoose';
import Sala from '@models/Sala.js'; // ajuste o caminho conforme seu alias/config
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // limpa as coleções após cada teste
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Sala Model', () => {
  it('deve criar uma sala com dados válidos', async () => {
    const salaData = {
      campus: new mongoose.Types.ObjectId(), // id fake para referência
      nome: 'Sala 101',
      bloco: 'Bloco A'
    };

    const sala = new Sala(salaData);
    const savedSala = await sala.save();

    expect(savedSala._id).toBeDefined();
    expect(savedSala.campus).toEqual(salaData.campus);
    expect(savedSala.nome).toBe('Sala 101');
    expect(savedSala.bloco).toBe('Bloco A');
    expect(savedSala.createdAt).toBeDefined();
    expect(savedSala.updatedAt).toBeDefined();
  });

  it('deve falhar se campos obrigatórios estiverem ausentes', async () => {
    const sala = new Sala({});

    let err = null;
    try {
      await sala.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.campus).toBeDefined();
    expect(err.errors.nome).toBeDefined();
    expect(err.errors.bloco).toBeDefined();
  });

  it('deve indexar o campo nome', () => {
    const indexes = Sala.schema.indexes();
    const hasNomeIndex = indexes.some(([indexFields]) => indexFields.nome === 1);
    expect(hasNomeIndex).toBe(true);
  });

  it('deve paginar resultados usando mongoose-paginate-v2', async () => {
    // Inserindo várias salas para testar paginação
    const campusId = new mongoose.Types.ObjectId();
    const salas = [];
    for (let i = 1; i <= 15; i++) {
      salas.push({
        campus: campusId,
        nome: `Sala ${i}`,
        bloco: 'Bloco B'
      });
    }
    await Sala.insertMany(salas);

    // Paginação: página 1, 10 itens por página
    const result = await Sala.paginate({}, { page: 1, limit: 10 });

    expect(result.docs.length).toBe(10);
    expect(result.totalDocs).toBe(15);
    expect(result.limit).toBe(10);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(2);
  });
});
