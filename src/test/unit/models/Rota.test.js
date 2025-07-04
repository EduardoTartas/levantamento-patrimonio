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

describe('Modelo de Rota - Criação (Conforme Schema Mongoose)', () => {
    const baseValidRotaData = () => ({
        rota: '/api/teste',
        dominio: 'usuario'
    });

    // --- Testes de criação com sucesso ---
    it('deve criar uma rota com dados válidos mínimos', async () => {
        const rotaData = baseValidRotaData();
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota).toBeDefined();
        expect(savedRota.rota).toBe(rotaData.rota);
        expect(savedRota.dominio).toBe(rotaData.dominio);
        expect(savedRota.ativo).toBe(true); // valor padrão
        expect(savedRota.buscar).toBe(false); // valor padrão
        expect(savedRota.enviar).toBe(false); // valor padrão
        expect(savedRota.substituir).toBe(false); // valor padrão
        expect(savedRota.modificar).toBe(false); // valor padrão
        expect(savedRota.excluir).toBe(false); // valor padrão
    });

    it('deve criar uma rota com todos os campos fornecidos', async () => {
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
        expect(savedRota.rota).toBe(rotaData.rota);
        expect(savedRota.dominio).toBe(rotaData.dominio);
        expect(savedRota.ativo).toBe(false);
        expect(savedRota.buscar).toBe(true);
        expect(savedRota.enviar).toBe(true);
        expect(savedRota.substituir).toBe(true);
        expect(savedRota.modificar).toBe(true);
        expect(savedRota.excluir).toBe(true);
    });

    it('deve criar uma rota com ativo=true explícito', async () => {
        const rotaData = { ...baseValidRotaData(), ativo: true };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.ativo).toBe(true);
    });

    it('deve criar uma rota com permissões específicas apenas', async () => {
        const rotaData = {
            ...baseValidRotaData(),
            buscar: true,
            modificar: true
        };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.buscar).toBe(true);
        expect(savedRota.modificar).toBe(true);
        expect(savedRota.enviar).toBe(false);
        expect(savedRota.substituir).toBe(false);
        expect(savedRota.excluir).toBe(false);
    });

    // --- Testes de validação de campos obrigatórios ---
    it('não deve criar uma rota sem o campo rota', async () => {
        const { rota, ...invalidData } = baseValidRotaData();
        const rotaInstance = new Rota(invalidData);
        await expect(rotaInstance.save()).rejects.toThrow(/Path `rota` is required/);
    });

    it('não deve criar uma rota com campo rota vazio', async () => {
        const invalidData = { ...baseValidRotaData(), rota: '' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Path `rota` is required/);
    });

    it('não deve criar uma rota sem o campo dominio', async () => {
        const { dominio, ...invalidData } = baseValidRotaData();
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Path `dominio` is required/);
    });

    it('não deve criar uma rota com campo dominio vazio', async () => {
        const invalidData = { ...baseValidRotaData(), dominio: '' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Path `dominio` is required/);
    });

    // --- Testes de tipos de dados ---
    it('deve converter número para string no campo rota', async () => {
        const invalidData = { ...baseValidRotaData(), rota: 123 };
        const rota = new Rota(invalidData);
        await rota.save();
        
        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.rota).toBe('123');
    });

    it('deve converter número para string no campo dominio', async () => {
        const invalidData = { ...baseValidRotaData(), dominio: 123 };
        const rota = new Rota(invalidData);
        await rota.save();
        
        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.dominio).toBe('123');
    });

    it('deve aceitar null para campo rota e falhar na validação required', async () => {
        const invalidData = { ...baseValidRotaData(), rota: null };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Path `rota` is required/);
    });

    it('deve aceitar null para campo dominio e falhar na validação required', async () => {
        const invalidData = { ...baseValidRotaData(), dominio: null };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Path `dominio` is required/);
    });

    // --- Testes de campos boolean ---
    it('não deve criar uma rota com campo ativo não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), ativo: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('não deve criar uma rota com campo buscar não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), buscar: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('não deve criar uma rota com campo enviar não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), enviar: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('não deve criar uma rota com campo substituir não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), substituir: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('não deve criar uma rota com campo modificar não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), modificar: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    it('não deve criar uma rota com campo excluir não boolean', async () => {
        const invalidData = { ...baseValidRotaData(), excluir: 'sim' };
        const rota = new Rota(invalidData);
        await expect(rota.save()).rejects.toThrow(/Cast to Boolean failed/);
    });

    // --- Testes de conversão de tipos ---
    it('deve converter string "true" para boolean true em campos boolean', async () => {
        const rotaData = {
            ...baseValidRotaData(),
            ativo: 'true',
            buscar: 'true'
        };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.ativo).toBe(true);
        expect(savedRota.buscar).toBe(true);
    });

    it('deve converter string "false" para boolean false em campos boolean', async () => {
        const rotaData = {
            ...baseValidRotaData(),
            ativo: 'false',
            buscar: 'false'
        };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.ativo).toBe(false);
        expect(savedRota.buscar).toBe(false);
    });

    it('deve converter números 1 e 0 para boolean', async () => {
        const rotaData = {
            ...baseValidRotaData(),
            ativo: 1,
            buscar: 0
        };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.ativo).toBe(true);
        expect(savedRota.buscar).toBe(false);
    });

    // --- Testes de campos opcionais ---
    it('deve permitir omitir todos os campos boolean (usando valores padrão)', async () => {
        const rotaData = {
            rota: '/api/minimo',
            dominio: 'teste'
        };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.ativo).toBe(true);
        expect(savedRota.buscar).toBe(false);
        expect(savedRota.enviar).toBe(false);
        expect(savedRota.substituir).toBe(false);
        expect(savedRota.modificar).toBe(false);
        expect(savedRota.excluir).toBe(false);
    });

    // --- Testes de campos extras (não definidos no schema) ---
    it('deve ignorar campos não definidos no schema', async () => {
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

    // --- Testes de validação com dados extremos ---
    it('deve aceitar string muito longa para rota', async () => {
        const longString = 'a'.repeat(1000);
        const rotaData = { ...baseValidRotaData(), rota: longString };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.rota).toBe(longString);
    });

    it('deve aceitar string muito longa para dominio', async () => {
        const longString = 'b'.repeat(1000);
        const rotaData = { ...baseValidRotaData(), dominio: longString };
        const rota = new Rota(rotaData);
        await rota.save();

        const savedRota = await Rota.findById(rota._id);
        expect(savedRota.dominio).toBe(longString);
    });

    it('deve aceitar caracteres especiais nos campos string', async () => {
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

    // --- Testes de atualização ---
    it('deve permitir atualizar todos os campos', async () => {
        const rotaData = baseValidRotaData();
        const rota = new Rota(rotaData);
        await rota.save();

        const updateData = {
            rota: '/api/atualizada',
            dominio: 'dominio-atualizado',
            ativo: false,
            buscar: true,
            enviar: true,
            substituir: true,
            modificar: true,
            excluir: true
        };

        await Rota.findByIdAndUpdate(rota._id, updateData);
        const updatedRota = await Rota.findById(rota._id);

        expect(updatedRota.rota).toBe(updateData.rota);
        expect(updatedRota.dominio).toBe(updateData.dominio);
        expect(updatedRota.ativo).toBe(false);
        expect(updatedRota.buscar).toBe(true);
        expect(updatedRota.enviar).toBe(true);
        expect(updatedRota.substituir).toBe(true);
        expect(updatedRota.modificar).toBe(true);
        expect(updatedRota.excluir).toBe(true);
    });

    // --- Testes de remoção ---
    it('deve permitir remover uma rota', async () => {
        const rotaData = baseValidRotaData();
        const rota = new Rota(rotaData);
        await rota.save();

        await Rota.findByIdAndDelete(rota._id);
        const deletedRota = await Rota.findById(rota._id);
        expect(deletedRota).toBeNull();
    });

    // --- Testes de busca e consulta ---
    it('deve permitir buscar rotas por critérios específicos', async () => {
        const rota1 = new Rota({ rota: '/api/rota1', dominio: 'usuario', buscar: true });
        const rota2 = new Rota({ rota: '/api/rota2', dominio: 'admin', buscar: false });
        const rota3 = new Rota({ rota: '/api/rota3', dominio: 'usuario', buscar: true });

        await Promise.all([rota1.save(), rota2.save(), rota3.save()]);

        const rotasUsuario = await Rota.find({ dominio: 'usuario' });
        expect(rotasUsuario).toHaveLength(2);

        const rotasComBuscar = await Rota.find({ buscar: true });
        expect(rotasComBuscar).toHaveLength(2);

        const rotasUsuarioComBuscar = await Rota.find({ dominio: 'usuario', buscar: true });
        expect(rotasUsuarioComBuscar).toHaveLength(2);
    });

    it('deve manter consistência dos dados após múltiplas operações', async () => {
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