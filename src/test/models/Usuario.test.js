import Usuario from '../../models/Usuario.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// src/tests/unit/models/Usuario.test.js

let mongoServer;

// Configuração antes de todos os testes
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
        // Opções de conexão não são necessárias no Mongoose 6+
    });
    
    // Garantir que as validações únicas funcionem no MongoDB Memory Server
    await mongoose.connection.collection('usuarios').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { cpf: 1 }, unique: true }
    ]);
});

// Limpeza após todos os testes
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Limpeza após cada teste para garantir isolamento
afterEach(async () => {
    jest.clearAllMocks();
    await Usuario.deleteMany({});
});

describe('Modelo de Usuário', () => {
    it('deve criar um usuário com dados válidos', async () => {
        const campusId = new mongoose.Types.ObjectId();

        const userData = {
            campus: campusId,
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin',
            status: true
        };

        const user = new Usuario(userData);
        await user.save();

        const savedUser = await Usuario.findById(user._id).select('-senha'); // Busca o usuário sem o campo senha

        expect(savedUser.nome).toBe(userData.nome);
        expect(savedUser.cpf).toBe(userData.cpf);
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.senha).toBeUndefined(); // Verificação para confirmar que senha não está presente
        expect(savedUser.cargo).toBe(userData.cargo);
        expect(savedUser.status).toBe(userData.status);
        expect(savedUser.campus.toString()).toBe(campusId.toString()); // Verificação do campo campus
    });

    it('não deve criar um usuário sem nome', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await expect(user.save()).rejects.toThrow('usuario validation failed: nome: Path `nome` is required.');
    });

    it('não deve criar um usuário sem CPF', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await expect(user.save()).rejects.toThrow('usuario validation failed: cpf: Path `cpf` is required.');
    });

    it('não deve criar um usuário sem email', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await expect(user.save()).rejects.toThrow('usuario validation failed: email: Path `email` is required.');
    });

    it('não deve criar um usuário sem cargo', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123'
        };

        const user = new Usuario(userData);
        await expect(user.save()).rejects.toThrow('usuario validation failed: cargo: Path `cargo` is required.');
    });

    it('deve garantir que o CPF do usuário seja único', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user1 = new Usuario(userData);
        await user1.save();

        const user2 = new Usuario({ ...userData, email: 'other@example.com' });
        await expect(user2.save()).rejects.toThrow(/duplicate key error/);
    });

    it('deve garantir que o email do usuário seja único', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'User One',
            cpf: '123.456.789-00',
            email: 'duplicate@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user1 = new Usuario(userData);
        await user1.save();

        const user2 = new Usuario({ ...userData, cpf: '987.654.321-00' });
        await expect(user2.save()).rejects.toThrow(/duplicate key error/);
    });

    it('ao cadastrar um usuário sem informar status, o valor padrão deve ser true', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await user.save();

        const savedUser = await Usuario.findById(user._id);
        expect(savedUser.status).toBe(true); // Verificação do valor padrão
    });

    it('o sistema deve registrar automaticamente as datas de criação e atualização', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await user.save();

        const savedUser = await Usuario.findById(user._id);
        expect(savedUser.createdAt).toBeDefined();
        expect(savedUser.updatedAt).toBeDefined();
    });

    it('deve retornar todos os usuários cadastrados', async () => {
        const user1 = new Usuario({
            campus: new mongoose.Types.ObjectId(),
            nome: 'User One',
            cpf: '123.456.789-00',
            email: 'user1@example.com',
            senha: 'password123',
            cargo: 'Admin'
        });
        await user1.save();

        const user2 = new Usuario({
            campus: new mongoose.Types.ObjectId(),
            nome: 'User Two',
            cpf: '987.654.321-00',
            email: 'user2@example.com',
            senha: 'password123',
            cargo: 'User'
        });
        await user2.save();

        const users = await Usuario.find();
        expect(users.length).toBe(2); // Verificação da quantidade de usuários
    });

    it('deve ser possível atualizar informações de um usuário válido', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await user.save();

        user.nome = 'Updated User';
        await user.save();

        const updatedUser = await Usuario.findById(user._id);
        expect(updatedUser.nome).toBe('Updated User'); // Verificação se o nome foi atualizado
    });

    it('um usuário existente deve ser removido do sistema', async () => {
        const userData = {
            campus: new mongoose.Types.ObjectId(),
            nome: 'Test User',
            cpf: '123.456.789-00',
            email: 'test@example.com',
            senha: 'password123',
            cargo: 'Admin'
        };

        const user = new Usuario(userData);
        await user.save();

        await Usuario.deleteOne({ _id: user._id });
        const removedUser = await Usuario.findById(user._id);
        expect(removedUser).toBeNull(); // Verificação de que o usuário foi removido
    });
});