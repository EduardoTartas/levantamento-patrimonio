import PermissionService from '@services/PermissionService.js';
import Usuario from '@models/Usuario.js';
import Rota from '@models/Rota.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Usuario.createIndexes();
    await Rota.createIndexes();
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}, 30000);

afterEach(async () => {
    jest.clearAllMocks();
    await Usuario.deleteMany({});
    await Rota.deleteMany({});
});

describe('PermissionService', () => {
    const generateValidObjectIdString = () => new mongoose.Types.ObjectId().toString();

    const createTestUser = async (cargo = 'Usuario') => {
        const userData = {
            campus: generateValidObjectIdString(),
            nome: 'Usuário Teste',
            cpf: '12345678909',
            email: 'teste@exemplo.com',
            cargo,
            status: true
        };
        const user = new Usuario(userData);
        await user.save();
        return user;
    };

    const createTestRota = async (permissions = {}) => {
        const rotaData = {
            rota: '/api/teste',
            dominio: 'usuario',
            ativo: true,
            buscar: false,
            enviar: false,
            substituir: false,
            modificar: false,
            excluir: false,
            ...permissions
        };
        const rota = new Rota(rotaData);
        await rota.save();
        return rota;
    };

    describe('hasPermission', () => {
        test('deve retornar false quando usuário não existe', async () => {
            const invalidUserId = generateValidObjectIdString();
            const result = await PermissionService.hasPermission(
                invalidUserId, 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        test('deve retornar false quando userId é null ou undefined', async () => {
            const result1 = await PermissionService.hasPermission(null, '/api/teste', 'usuario', 'buscar');
            const result2 = await PermissionService.hasPermission(undefined, '/api/teste', 'usuario', 'buscar');
            expect(result1).toBe(false);
            expect(result2).toBe(false);
        });

        test('deve retornar true para Funcionario Cpalm independente da rota', async () => {
            const user = await createTestUser('Funcionario Cpalm');
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/qualquer', 
                'qualquer', 
                'buscar'
            );
            expect(result).toBe(true);
        });

        test('deve retornar true para Funcionario Cpalm com todos os métodos', async () => {
            const user = await createTestUser('Funcionario Cpalm');
            const userId = user._id.toString();
            
            const methods = ['buscar', 'enviar', 'substituir', 'modificar', 'excluir'];
            
            for (const metodo of methods) {
                const result = await PermissionService.hasPermission(
                    userId, 
                    '/api/teste', 
                    'usuario', 
                    metodo
                );
                expect(result).toBe(true);
            }
        });

        test('deve retornar false quando rota não existe', async () => {
            const user = await createTestUser('Usuario');
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/inexistente', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        test('deve retornar false quando rota está inativa', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ ativo: false, buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        test('deve retornar false quando dominio não corresponde', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'admin', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        test('deve verificar permissões específicas para cada método', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true, enviar: false, modificar: true, excluir: false });
            
            const userId = user._id.toString();
            
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'buscar')).toBe(true);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'enviar')).toBe(false);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'modificar')).toBe(true);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'excluir')).toBe(false);
        });

        test('deve retornar undefined para método não reconhecido', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'metodo_inexistente'
            );
            expect(result).toBeUndefined();
        });

        test('deve funcionar com diferentes cargos', async () => {
            const cargos = ['Admin', 'Usuario', 'Comissionado', 'Servidor'];
            
            for (const cargo of cargos) {
                const user = await createTestUser(cargo);
                await createTestRota({ buscar: true });
                
                const result = await PermissionService.hasPermission(
                    user._id.toString(), 
                    '/api/teste', 
                    'usuario', 
                    'buscar'
                );
                expect(result).toBe(true);
                
                await Usuario.deleteMany({});
                await Rota.deleteMany({});
            }
        });

        test('deve ser case-sensitive para rota e domínio', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result1 = await PermissionService.hasPermission(
                user._id.toString(), 
                '/API/TESTE', 
                'usuario', 
                'buscar'
            );
            expect(result1).toBe(false);
            
            const result2 = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'USUARIO', 
                'buscar'
            );
            expect(result2).toBe(false);
        });
    });
});