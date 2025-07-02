import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import DbConnect from '@config/dbConnect.js';
import mongoose from 'mongoose';
import logger from '@utils/logger.js';

jest.mock('mongoose', () => ({
    set: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
        on: jest.fn(),
        readyState: 0
    }
}));

jest.mock('@utils/logger.js', () => ({
    info: jest.fn(),
    error: jest.fn()
}));

describe('DbConnect', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
        jest.clearAllMocks();
        mongoose.connect.mockResolvedValue();
        mongoose.disconnect.mockResolvedValue();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('conectar', () => {
        it('deve conectar com sucesso usando configuração padrão', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';

            await DbConnect.conectar();

            expect(logger.info).toHaveBeenCalledWith('DB_URL está definida.');
            expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                retryWrites: true,
                maxPoolSize: 10
            });
            expect(logger.info).toHaveBeenCalledWith('Conexão com o banco estabelecida!');
        });

        it('deve conectar com timeouts personalizados via variáveis de ambiente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = '8000';
            process.env.MONGO_SOCKET_TIMEOUT_MS = '60000';
            process.env.MONGO_CONNECT_TIMEOUT_MS = '15000';
            process.env.MONGO_MAX_POOL_SIZE = '20';

            await DbConnect.conectar();

            expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', {
                serverSelectionTimeoutMS: 8000,
                socketTimeoutMS: 60000,
                connectTimeoutMS: 15000,
                retryWrites: true,
                maxPoolSize: 20
            });
        });

        it('deve configurar ambiente de desenvolvimento corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            process.env.NODE_ENV = 'development';

            await DbConnect.conectar();

            expect(mongoose.set).toHaveBeenCalledWith('strictQuery', false);
            expect(mongoose.set).toHaveBeenCalledWith('autoIndex', true);
            expect(mongoose.set).toHaveBeenCalledWith('debug', false);
            expect(logger.info).toHaveBeenCalledWith('Configurações de desenvolvimento ativadas: autoIndex ativado e debug desativado.');
        });

        it('deve configurar ambiente de teste corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            process.env.NODE_ENV = 'test';

            await DbConnect.conectar();

            expect(mongoose.set).toHaveBeenCalledWith('strictQuery', false);
            expect(mongoose.set).toHaveBeenCalledWith('autoIndex', false);
            expect(mongoose.set).toHaveBeenCalledWith('debug', false);
            expect(logger.info).toHaveBeenCalledWith('Configurações de produção ativadas: autoIndex e debug desativados.');
        });

        it('deve configurar ambiente de produção corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            process.env.NODE_ENV = 'production';

            await DbConnect.conectar();

            expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
            expect(mongoose.set).toHaveBeenCalledWith('autoIndex', false);
            expect(mongoose.set).toHaveBeenCalledWith('debug', false);
            expect(logger.info).toHaveBeenCalledWith('Configurações de produção ativadas: autoIndex e debug desativados.');
        });

        it('deve configurar listeners de eventos do mongoose', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';

            await DbConnect.conectar();

            expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
            expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
        });

        it('deve lançar erro quando DB_URL não está definida', async () => {
            delete process.env.DB_URL;

            await expect(DbConnect.conectar()).rejects.toThrow('A variável de ambiente DB_URL não foi definida.');
            expect(mongoose.connect).not.toHaveBeenCalled();
        });

        it('deve propagar erro de conexão do mongoose', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            const connectionError = new Error('Connection failed');
            mongoose.connect.mockRejectedValue(connectionError);

            await expect(DbConnect.conectar()).rejects.toThrow('Connection failed');
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringMatching(/Erro na conexão com o banco de dados em .+: Connection failed/)
            );
        });
    });

    describe('desconectar', () => {
        it('deve desconectar com sucesso', async () => {
            await DbConnect.desconectar();

            expect(mongoose.disconnect).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Conexão com o banco encerrada!');
        });

        it('deve propagar erro de desconexão do mongoose', async () => {
            const disconnectionError = new Error('Disconnection failed');
            mongoose.disconnect.mockRejectedValue(disconnectionError);

            await expect(DbConnect.desconectar()).rejects.toThrow('Disconnection failed');
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringMatching(/Erro ao desconectar do banco de dados em .+: Disconnection failed/)
            );
        });
    });

    describe('Event listeners', () => {
        it('deve executar callback connected corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            
            // Captura o callback do evento 'connected'
            let connectedCallback;
            mongoose.connection.on.mockImplementation((event, callback) => {
                if (event === 'connected') {
                    connectedCallback = callback;
                }
            });

            await DbConnect.conectar();

            // Executa o callback
            connectedCallback();

            expect(logger.info).toHaveBeenCalledWith('Mongoose conectado ao MongoDB.');
        });

        it('deve executar callback error corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            
            // Captura o callback do evento 'error'
            let errorCallback;
            mongoose.connection.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    errorCallback = callback;
                }
            });

            await DbConnect.conectar();

            // Executa o callback com um erro
            const testError = new Error('Connection lost');
            errorCallback(testError);

            expect(logger.error).toHaveBeenCalledWith('Mongoose erro: Error: Connection lost');
        });

        it('deve executar callback disconnected corretamente', async () => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            
            // Captura o callback do evento 'disconnected'
            let disconnectedCallback;
            mongoose.connection.on.mockImplementation((event, callback) => {
                if (event === 'disconnected') {
                    disconnectedCallback = callback;
                }
            });

            await DbConnect.conectar();

            // Executa o callback
            disconnectedCallback();

            expect(logger.info).toHaveBeenCalledWith('Mongoose desconectado do MongoDB.');
        });
    });
});
