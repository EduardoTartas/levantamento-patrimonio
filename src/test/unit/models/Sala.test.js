import mongoose from 'mongoose';
import Sala from '@models/Sala.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Sala.deleteMany({});
});

describe('Sala Model', () => {
  const validSalaData = {
    campus: new mongoose.Types.ObjectId(),
    nome: 'Sala 101',
    bloco: 'Bloco A'
  };

  describe('Constructor e Schema', () => {
    test('deve ter schema correto', () => {
      const schema = Sala.schema;
      expect(schema.paths.campus).toBeDefined();
      expect(schema.paths.nome).toBeDefined();
      expect(schema.paths.bloco).toBeDefined();
      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    test('deve ter plugin de paginação', () => {
      expect(typeof Sala.paginate).toBe('function');
    });

    test('deve ter índice no campo nome', () => {
      const indexes = Sala.schema.indexes();
      const hasNomeIndex = indexes.some(([fields]) => fields.nome === 1);
      expect(hasNomeIndex).toBe(true);
    });
  });

  describe('Validações', () => {
    test('deve criar sala com dados válidos', async () => {
      const sala = new Sala(validSalaData);
      const savedSala = await sala.save();

      expect(savedSala._id).toBeDefined();
      expect(savedSala.campus.toString()).toBe(validSalaData.campus.toString());
      expect(savedSala.nome).toBe('Sala 101');
      expect(savedSala.bloco).toBe('Bloco A');
      expect(savedSala.createdAt).toBeInstanceOf(Date);
      expect(savedSala.updatedAt).toBeInstanceOf(Date);
    });

    test('deve falhar sem campos obrigatórios', async () => {
      const testCases = [
        { data: { nome: 'Test', bloco: 'A' }, missing: 'campus' },
        { data: { campus: new mongoose.Types.ObjectId(), bloco: 'A' }, missing: 'nome' },
        { data: { campus: new mongoose.Types.ObjectId(), nome: 'Test' }, missing: 'bloco' },
        { data: {}, missing: 'all' }
      ];

      for (const testCase of testCases) {
        const sala = new Sala(testCase.data);
        await expect(sala.save()).rejects.toThrow();
      }
    });

    test('deve falhar com campus inválido', async () => {
      const sala = new Sala({ ...validSalaData, campus: 'invalid-id' });
      await expect(sala.save()).rejects.toThrow(/Cast to ObjectId failed/);
    });

    test('deve aceitar diferentes tipos de ObjectId', async () => {
      const objectIdString = '507f1f77bcf86cd799439011';
      const sala = new Sala({ ...validSalaData, campus: objectIdString });
      const savedSala = await sala.save();
      expect(savedSala.campus.toString()).toBe(objectIdString);
    });
  });

  describe('CRUD Operations', () => {
    test('deve realizar operações CRUD básicas', async () => {
      // Create
      const sala = await Sala.create(validSalaData);
      expect(sala._id).toBeDefined();

      // Read
      const foundSala = await Sala.findById(sala._id);
      expect(foundSala._id.toString()).toBe(sala._id.toString());

      // Update
      const updatedSala = await Sala.findByIdAndUpdate(
        sala._id, { nome: 'Sala Atualizada' }, { new: true }
      );
      expect(updatedSala.nome).toBe('Sala Atualizada');

      // Delete
      await Sala.findByIdAndDelete(sala._id);
      const deletedSala = await Sala.findById(sala._id);
      expect(deletedSala).toBeNull();
    });

    test('deve criar e buscar múltiplas salas', async () => {
      const campus1 = new mongoose.Types.ObjectId();
      const campus2 = new mongoose.Types.ObjectId();
      
      await Sala.insertMany([
        { campus: campus1, nome: 'Lab 1', bloco: 'A' },
        { campus: campus1, nome: 'Lab 2', bloco: 'B' },
        { campus: campus2, nome: 'Lab 3', bloco: 'A' }
      ]);

      const salasCampus1 = await Sala.find({ campus: campus1 });
      const salasBlcoA = await Sala.find({ bloco: 'A' });
      
      expect(salasCampus1).toHaveLength(2);
      expect(salasBlcoA).toHaveLength(2);
    });
  });

  describe('Paginação', () => {
    test('deve paginar resultados corretamente', async () => {
      const campus = new mongoose.Types.ObjectId();
      const salas = Array.from({ length: 25 }, (_, i) => ({
        campus, nome: `Sala ${i + 1}`, bloco: 'Bloco A'
      }));
      await Sala.insertMany(salas);

      const page1 = await Sala.paginate({}, { page: 1, limit: 10 });
      const page3 = await Sala.paginate({}, { page: 3, limit: 10 });

      expect(page1.docs).toHaveLength(10);
      expect(page1.totalDocs).toBe(25);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.hasPrevPage).toBe(false);

      expect(page3.docs).toHaveLength(5);
      expect(page3.hasNextPage).toBe(false);
      expect(page3.hasPrevPage).toBe(true);
    });

    test('deve aplicar filtros com paginação', async () => {
      const campus = new mongoose.Types.ObjectId();
      await Sala.insertMany([
        { campus, nome: 'Lab 1', bloco: 'A' },
        { campus, nome: 'Lab 2', bloco: 'A' },
        { campus, nome: 'Sala 1', bloco: 'B' }
      ]);

      const result = await Sala.paginate({ bloco: 'A' }, { page: 1, limit: 5 });
      expect(result.docs).toHaveLength(2);
      expect(result.totalDocs).toBe(2);
      expect(result.docs.every(sala => sala.bloco === 'A')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('deve lidar com diferentes cenários', async () => {
      // Strings vazias
      const salaEmpty = new Sala({ ...validSalaData, nome: '', bloco: '' });
      await expect(salaEmpty.save()).rejects.toThrow();

      // Caracteres especiais
      const salaSpecial = new Sala({ 
        ...validSalaData, 
        nome: 'Sala 101-A (Lab)', 
        bloco: 'Bloco A-1' 
      });
      const savedSpecial = await salaSpecial.save();
      expect(savedSpecial.nome).toBe('Sala 101-A (Lab)');

      // Campus inexistente (deve aceitar)
      const fakeId = new mongoose.Types.ObjectId();
      const salaFake = new Sala({ ...validSalaData, campus: fakeId });
      const savedFake = await salaFake.save();
      expect(savedFake.campus.toString()).toBe(fakeId.toString());

      // Verificar que possui referência
      const sala = await Sala.create(validSalaData);
      expect(sala.campus).toBeDefined();
      expect(sala.campus).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });
});
