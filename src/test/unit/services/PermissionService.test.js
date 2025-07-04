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
        // --- Testes com usuário não encontrado ---
        it('deve retornar false quando usuário não existe', async () => {
            const invalidUserId = generateValidObjectIdString();
            const result = await PermissionService.hasPermission(
                invalidUserId, 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar false quando userId é null', async () => {
            const result = await PermissionService.hasPermission(
                null, 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar false quando userId é undefined', async () => {
            const result = await PermissionService.hasPermission(
                undefined, 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar false quando userId é string inválida', async () => {
            try {
                const result = await PermissionService.hasPermission(
                    'invalid-id', 
                    '/api/teste', 
                    'usuario', 
                    'buscar'
                );
                expect(result).toBe(false);
            } catch (error) {
                // Mongoose lança erro de cast para ObjectId inválido
                expect(error.name).toBe('CastError');
                expect(error.message).toMatch(/Cast to ObjectId failed/);
            }
        });

        // --- Testes com usuário "Funcionario Cpalm" (acesso total) ---
        it('deve retornar true para Funcionario Cpalm independente da rota', async () => {
            const user = await createTestUser('Funcionario Cpalm');
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/qualquer', 
                'qualquer', 
                'buscar'
            );
            expect(result).toBe(true);
        });

        it('deve retornar true para Funcionario Cpalm com todos os métodos', async () => {
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

        it('deve retornar true para Funcionario Cpalm mesmo sem rota existente', async () => {
            const user = await createTestUser('Funcionario Cpalm');
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/inexistente', 
                'inexistente', 
                'buscar'
            );
            expect(result).toBe(true);
        });

        // --- Testes com rota não encontrada ---
        it('deve retornar false quando rota não existe', async () => {
            const user = await createTestUser('Usuario');
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/inexistente', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar false quando rota existe mas está inativa', async () => {
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

        it('deve retornar false quando dominio não corresponde', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'admin', // domínio diferente
                'buscar'
            );
            expect(result).toBe(false);
        });

        // --- Testes de permissões específicas por método ---
        it('deve retornar true quando usuário tem permissão de buscar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(true);
        });

        it('deve retornar false quando usuário não tem permissão de buscar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: false });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar true quando usuário tem permissão de enviar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ enviar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'enviar'
            );
            expect(result).toBe(true);
        });

        it('deve retornar false quando usuário não tem permissão de enviar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ enviar: false });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'enviar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar true quando usuário tem permissão de substituir', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ substituir: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'substituir'
            );
            expect(result).toBe(true);
        });

        it('deve retornar false quando usuário não tem permissão de substituir', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ substituir: false });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'substituir'
            );
            expect(result).toBe(false);
        });

        it('deve retornar true quando usuário tem permissão de modificar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ modificar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'modificar'
            );
            expect(result).toBe(true);
        });

        it('deve retornar false quando usuário não tem permissão de modificar', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ modificar: false });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'modificar'
            );
            expect(result).toBe(false);
        });

        it('deve retornar true quando usuário tem permissão de excluir', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ excluir: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'excluir'
            );
            expect(result).toBe(true);
        });

        it('deve retornar false quando usuário não tem permissão de excluir', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ excluir: false });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                'excluir'
            );
            expect(result).toBe(false);
        });

        // --- Testes com métodos inválidos ---
        it('deve retornar undefined para método não reconhecido', async () => {
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

        it('deve retornar undefined para método null', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                null
            );
            expect(result).toBeUndefined();
        });

        it('deve retornar undefined para método undefined', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'usuario', 
                undefined
            );
            expect(result).toBeUndefined();
        });

        // --- Testes com combinações de permissões ---
        it('deve verificar permissões específicas independentemente de outras', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ 
                buscar: true, 
                enviar: false, 
                modificar: true, 
                excluir: false 
            });
            
            const userId = user._id.toString();
            
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'buscar')).toBe(true);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'enviar')).toBe(false);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'modificar')).toBe(true);
            expect(await PermissionService.hasPermission(userId, '/api/teste', 'usuario', 'excluir')).toBe(false);
        });

        // --- Testes com diferentes tipos de usuário ---
        it('deve funcionar com diferentes cargos que não são Funcionario Cpalm', async () => {
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
                
                // Limpeza para próximo teste
                await Usuario.deleteMany({});
                await Rota.deleteMany({});
            }
        });

        // --- Testes de casos extremos ---
        it('deve funcionar com rotas com caracteres especiais', async () => {
            const user = await createTestUser('Usuario');
            const rotaEspecial = new Rota({
                rota: '/api/test!@#$%^&*()',
                dominio: 'domínio-especial',
                ativo: true,
                buscar: true
            });
            await rotaEspecial.save();
            
            const result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/test!@#$%^&*()', 
                'domínio-especial', 
                'buscar'
            );
            expect(result).toBe(true);
        });

        it('deve ser case-sensitive para rota e domínio', async () => {
            const user = await createTestUser('Usuario');
            await createTestRota({ buscar: true });
            
            // Teste case-sensitive para rota
            let result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/API/TESTE', // maiúsculo
                'usuario', 
                'buscar'
            );
            expect(result).toBe(false);
            
            // Teste case-sensitive para domínio
            result = await PermissionService.hasPermission(
                user._id.toString(), 
                '/api/teste', 
                'USUARIO', // maiúsculo
                'buscar'
            );
            expect(result).toBe(false);
        });

        it('deve verificar múltiplas rotas com mesmo usuário', async () => {
            const user = await createTestUser('Usuario');
            
            // Criar múltiplas rotas
            const rota1 = new Rota({
                rota: '/api/rota1',
                dominio: 'usuario',
                ativo: true,
                buscar: true
            });
            
            const rota2 = new Rota({
                rota: '/api/rota2',
                dominio: 'usuario',
                ativo: true,
                buscar: false
            });
            
            await Promise.all([rota1.save(), rota2.save()]);
            
            const userId = user._id.toString();
            
            expect(await PermissionService.hasPermission(userId, '/api/rota1', 'usuario', 'buscar')).toBe(true);
            expect(await PermissionService.hasPermission(userId, '/api/rota2', 'usuario', 'buscar')).toBe(false);
        });
    });
});