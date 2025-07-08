import Usuario from '@models/Usuario.js'; 
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const generateValidObjectIdString = () => new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Usuario.createIndexes(); 
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}, 30000);

afterEach(async () => {
    jest.clearAllMocks();
    await Usuario.deleteMany({});
});

describe('Modelo de Usuário - Criação (Conforme Schema Mongoose)', () => {
    const baseValidUserData = () => ({
        campus: generateValidObjectIdString(),
        nome: 'Usuário Teste Válido',
        cpf: '12345678909', 
        email: 'teste.valido@example.com', 
        cargo: 'Comissionado',
    });

    it('deve criar um usuário com dados válidos e status padrão true (quando status não é fornecido)', async () => {
        const userData = { ...baseValidUserData(), senha: 'OptionalPassword123' };
        const user = new Usuario(userData);
        await user.save();

        const savedUser = await Usuario.findById(user._id);
        expect(savedUser.status).toBe(true);
    });

    it('deve criar um usuário com dados válidos SEM senha (pois não é required no Mongoose)', async () => {
        const userData = baseValidUserData();
        const user = new Usuario(userData);
        await user.save();

        const savedUser = await Usuario.findById(user._id);
        expect(savedUser).toBeDefined();
        expect(savedUser.senha).toBeUndefined();
        const savedUserWithPassword = await Usuario.findById(user._id).select('+senha');
        expect(savedUserWithPassword.senha).toBeUndefined();
    });

    it('não deve criar um usuário sem nome', async () => {
        const { nome, ...invalidData } = baseValidUserData();
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Path `nome` is required/);
    });

    it('não deve criar um usuário sem CPF', async () => {
        const { cpf, ...invalidData } = baseValidUserData();
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Path `cpf` is required/);
    });

    it('não deve criar um usuário sem email', async () => {
        const { email, ...invalidData } = baseValidUserData();
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Path `email` is required/);
    });

    it('não deve criar um usuário sem cargo', async () => {
        const { cargo, ...invalidData } = baseValidUserData();
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Path `cargo` is required/);
    });


    it('não deve criar um usuário sem campus', async () => {
        const { campus, ...invalidData } = baseValidUserData();
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Path `campus` is required/);
    });

    it('não deve criar um usuário com campus inválido (não ObjectId string)', async () => {
        const invalidData = { ...baseValidUserData(), campus: 'nao-e-um-objectid' };
        const user = new Usuario(invalidData);
        await expect(user.save()).rejects.toThrow(/Cast to ObjectId failed for value "nao-e-um-objectid"/);
    });

    it('deve garantir que o CPF do usuário seja único', async () => {
        const userData = baseValidUserData();
        await new Usuario(userData).save();

        const user2 = new Usuario({ ...userData, email: 'other.unique@example.com' });
        await expect(user2.save()).rejects.toThrow(/E11000 duplicate key error.*?index: cpf_1/);
    });

    it('deve garantir que o email do usuário seja único', async () => {
        const userData = baseValidUserData();
        await new Usuario(userData).save();

        const user2 = new Usuario({ ...userData, cpf: '98765432100' });
        await expect(user2.save()).rejects.toThrow(/E11000 duplicate key error.*?index: email_1/);
    });

    it('deve retornar todos os usuários cadastrados', async () => {
        const user1Data = {
            ...baseValidUserData(),
            email: 'user1@example.com',
            cpf: '11122233344',
        };
        const user2Data = {
            ...baseValidUserData(),
            email: 'user2@example.com',
            cpf: '55566677788'
        };
        await new Usuario(user1Data).save();
        await new Usuario(user2Data).save();

        const users = await Usuario.find();
        expect(users.length).toBe(2);
    });
});

describe('Modelo de Usuário - Atualização (Conforme Schema Mongoose)', () => {
    let existingUserId;
    let originalPasswordHash; 
    const baseInitialUserData = () => ({ 
        campus: generateValidObjectIdString(),
        nome: 'Usuário Original',
        cpf: '00011122233',
        email: 'original@example.com',
        senha: 'Senha@Original1', 
        cargo: 'Comissionado',
        status: true,
    });

    beforeEach(async () => {
        const initialUser = baseInitialUserData();
        const user = new Usuario(initialUser);
        await user.save();
        existingUserId = user._id;
        const userWithPass = await Usuario.findById(existingUserId).select('+senha');
        originalPasswordHash = userWithPass.senha;
    });

    it('deve ser possível atualizar informações de um usuário válido (ex: nome)', async () => {
        const updatedName = 'Nome Atualizado Teste';
        const user = await Usuario.findById(existingUserId);
        user.nome = updatedName;
        await user.save();

        const updatedUser = await Usuario.findById(existingUserId);
        expect(updatedUser.nome).toBe(updatedName);
        expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(updatedUser.createdAt.getTime());
    });

    it('deve permitir atualização de status para false', async () => {
        const user = await Usuario.findById(existingUserId);
        user.status = false;
        await user.save();

        const updatedUser = await Usuario.findById(existingUserId);
        expect(updatedUser.status).toBe(false);
    });

    it('deve manter a senha inalterada se o campo senha não for fornecido na atualização', async () => {
        const user = await Usuario.findById(existingUserId).select('+senha');
        const currentPasswordHash = user.senha;

        user.nome = "Nome Alterado Sem Mudar Senha";
        await user.save();

        const updatedUser = await Usuario.findById(existingUserId).select('+senha');
        expect(updatedUser.nome).toBe("Nome Alterado Sem Mudar Senha");
        expect(updatedUser.senha).toBe(currentPasswordHash);
    });
});

describe('Modelo de Usuário - Remoção', () => {
    it('um usuário existente deve ser removido do sistema', async () => {
        const userData = {
            campus: generateValidObjectIdString(),
            nome: 'Usuário Para Remover',
            cpf: '99988877766',
            email: 'remover@example.com',
            cargo: 'Funcionario Cpalm'
        };
        const user = new Usuario(userData);
        await user.save();
        const userId = user._id;

        expect(await Usuario.findById(userId)).not.toBeNull();

        const result = await Usuario.deleteOne({ _id: userId });
        expect(result.deletedCount).toBe(1);

        const removedUser = await Usuario.findById(userId);
        expect(removedUser).toBeNull();
    });
});