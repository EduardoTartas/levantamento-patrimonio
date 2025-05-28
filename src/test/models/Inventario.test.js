import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import InventarioModel from '@models/Inventario';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await InventarioModel.deleteMany({});
});

describe('Inventario Model', () => {
  const mockCampusId = new mongoose.Types.ObjectId();

  describe('**Criação de Inventário**', () => {
    it('Campos obrigatórios: deve falhar ao tentar salvar sem campos obrigatórios', async () => {
      const inventarioData = { nome: 'Inventário Teste', data: new Date() };
      let err;
      try {
        const inventario = new InventarioModel(inventarioData);
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.campus).toBeDefined();

      const inventarioData2 = { campus: mockCampusId, data: new Date() };
      err = null;
      try {
        const inventario = new InventarioModel(inventarioData2);
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.nome).toBeDefined();

      const inventarioData3 = { campus: mockCampusId, nome: 'Inventário Teste' };
      err = null;
      try {
        const inventario = new InventarioModel(inventarioData3);
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.data).toBeDefined();
    });

    it('Cadastro válido: deve salvar um inventário com todos os campos obrigatórios válidos', async () => {
      const inventarioData = {
        campus: mockCampusId,
        nome: 'Inventário Principal',
        data: new Date(),
      };
      const inventario = new InventarioModel(inventarioData);
      const savedInventario = await inventario.save();

      expect(savedInventario._id).toBeDefined();
      expect(savedInventario.campus.toString()).toBe(mockCampusId.toString());
      expect(savedInventario.nome).toBe(inventarioData.nome);
      expect(savedInventario.data).toEqual(inventarioData.data);
      expect(savedInventario.createdAt).toBeDefined();
      expect(savedInventario.updatedAt).toBeDefined();
    });

    it('Valor padrão de `status`: deve ser `true` ao cadastrar sem informar `status`', async () => {
      const inventarioData = {
        campus: mockCampusId,
        nome: 'Inventário Com Status Padrão',
        data: new Date(),
      };
      const inventario = new InventarioModel(inventarioData);
      const savedInventario = await inventario.save();

      expect(savedInventario.status).toBe(true);
    });

    it('Validação de Formato do `campus`: deve falhar com ObjectId inválido para campus', async () => {
      const inventarioData = {
        campus: 'id-invalido-123',
        nome: 'Inventário Campus Inválido',
        data: new Date(),
      };
      let err;
      try {
        const inventario = new InventarioModel(inventarioData);
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.campus).toBeInstanceOf(mongoose.Error.CastError);
      expect(err.errors.campus.message).toContain('Cast to ObjectId failed for value "id-invalido-123"');
    });

    it('Validação de Formato da `data`: deve falhar com data inválida', async () => {
      const inventarioData = {
        campus: mockCampusId,
        nome: 'Inventário Data Inválida',
        data: 'data-nao-eh-data',
      };
      let err;
      try {
        const inventario = new InventarioModel(inventarioData);
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.data).toBeInstanceOf(mongoose.Error.CastError);
      expect(err.errors.data.message).toContain('Cast to date failed for value "data-nao-eh-data"');
    });

    it('Indexação do campo `nome`: (verificação da definição do schema)', () => {
      const schemaPaths = InventarioModel.schema.paths;
      expect(schemaPaths.nome.options.index).toBe(true);
    });

    it('Registro de `timestamps`: deve registrar `createdAt` e `updatedAt`', async () => {
      const inventarioData = {
        campus: mockCampusId,
        nome: 'Inventário Timestamps',
        data: new Date(),
      };
      const inventario = new InventarioModel(inventarioData);
      const savedInventario = await inventario.save();

      expect(savedInventario.createdAt).toBeInstanceOf(Date);
      expect(savedInventario.updatedAt).toBeInstanceOf(Date);
    });

    it('Ausência de `versionKey`: o campo `__v` não deve estar presente', async () => {
      const inventarioData = {
        campus: mockCampusId,
        nome: 'Inventário Sem VersionKey',
        data: new Date(),
      };
      const inventario = new InventarioModel(inventarioData);
      const savedInventario = await inventario.save();
      expect(savedInventario.__v).toBeUndefined();
    });
  });

  describe('**Leitura de Inventários**', () => {
    beforeEach(async () => {
      await InventarioModel.create([
        { campus: mockCampusId, nome: 'Inventário Leitura A', data: new Date(), status: true },
        { campus: new mongoose.Types.ObjectId(), nome: 'Inventário Leitura B', data: new Date(), status: false },
      ]);
    });

    it('Listar todos os inventários: deve retornar todos os inventários cadastrados', async () => {
      const inventarios = await InventarioModel.find({});
      expect(inventarios.length).toBe(2);
    });

    it('Paginação (mongoose-paginate-v2): deve funcionar conforme o plugin', async () => {
      await InventarioModel.create([
        { campus: mockCampusId, nome: 'Inv Paginado 1', data: new Date() },
        { campus: mockCampusId, nome: 'Inv Paginado 2', data: new Date() },
        { campus: mockCampusId, nome: 'Inv Paginado 3', data: new Date() },
      ]);

      const options = { page: 1, limit: 2, sort: { nome: 1 } };
      const result = await InventarioModel.paginate({}, options);

      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(5);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(result.docs[0].nome).toBe('Inv Paginado 1');
    });
  });

  describe('**Atualização de Inventário**', () => {
    let inventarioParaAtualizar;

    beforeEach(async () => {
      inventarioParaAtualizar = await new InventarioModel({
        campus: mockCampusId,
        nome: 'Inventário Original',
        data: new Date('2023-01-01'),
        status: true,
      }).save();
    });

    it('Atualização de campos genéricos: deve atualizar `nome`, `status`, `data`, `campus`', async () => {
      const novoCampusId = new mongoose.Types.ObjectId();
      const updates = {
        nome: 'Inventário Atualizado',
        status: false,
        data: new Date('2024-01-01'),
        campus: novoCampusId,
      };

      const inventarioAtualizado = await InventarioModel.findByIdAndUpdate(
        inventarioParaAtualizar._id,
        updates,
        { new: true }
      );

      expect(inventarioAtualizado.nome).toBe(updates.nome);
      expect(inventarioAtualizado.status).toBe(updates.status);
      expect(inventarioAtualizado.data.toISOString()).toBe(updates.data.toISOString());
      expect(inventarioAtualizado.campus.toString()).toBe(novoCampusId.toString());
      expect(inventarioAtualizado.updatedAt.getTime()).toBeGreaterThan(inventarioParaAtualizar.updatedAt.getTime());
    });

    it('Validação de campos obrigatórios (Update): não deve permitir atualizar campos obrigatórios para nulos/inválidos', async () => {
      const inventario = await InventarioModel.findById(inventarioParaAtualizar._id);
      inventario.nome = '';
      let err = null;
      try {
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.nome).toBeDefined();

      inventario.data = null;
      err = null;
      try {
        inventario.nome = "Nome Valido";
        await inventario.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      if (err.errors.data) {
          expect(err.errors.data).toBeDefined();
      }
    });

    it('Atualização de `status`: deve ser possível atualizar o campo `status`', async () => {
      const inventario = await InventarioModel.findByIdAndUpdate(
        inventarioParaAtualizar._id,
        { status: false },
        { new: true }
      );
      expect(inventario.status).toBe(false);

      const inventario2 = await InventarioModel.findByIdAndUpdate(
        inventarioParaAtualizar._id,
        { status: true },
        { new: true }
      );
      expect(inventario2.status).toBe(true);
    });
  });

  describe('**Remoção de Inventário**', () => {
    let inventarioParaRemover;

    beforeEach(async () => {
      inventarioParaRemover = await new InventarioModel({
        campus: mockCampusId,
        nome: 'Inventário Para Remover',
        data: new Date(),
      }).save();
    });

    it('Remoção de inventário existente: deve remover um inventário', async () => {
      const result = await InventarioModel.deleteOne({ _id: inventarioParaRemover._id });
      expect(result.deletedCount).toBe(1);

      const inventarioEncontrado = await InventarioModel.findById(inventarioParaRemover._id);
      expect(inventarioEncontrado).toBeNull();
    });

    it('Remoção com findByIdAndDelete: deve remover e retornar o documento ou null', async () => {
        const removedDoc = await InventarioModel.findByIdAndDelete(inventarioParaRemover._id);
        expect(removedDoc).toBeDefined();
        expect(removedDoc._id.toString()).toBe(inventarioParaRemover._id.toString());

        const inventarioEncontrado = await InventarioModel.findById(inventarioParaRemover._id);
        expect(inventarioEncontrado).toBeNull();

        const nonExistentId = new mongoose.Types.ObjectId();
        const removedNonExistentDoc = await InventarioModel.findByIdAndDelete(nonExistentId);
        expect(removedNonExistentDoc).toBeNull();
    });
  });
});