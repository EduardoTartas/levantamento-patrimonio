import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('minio', () => ({
    Client: jest.fn().mockImplementation(() => ({
        bucketExists: jest.fn(),
        makeBucket: jest.fn(),
        listBuckets: jest.fn()
    }))
}));

jest.mock('dotenv/config', () => ({}));

describe('minioConnect', () => {
    let originalEnv;
    let MockedMinioClient;

    beforeEach(() => {
        originalEnv = { ...process.env };
        jest.clearAllMocks();
        const Minio = require('minio');
        MockedMinioClient = Minio.Client;
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.resetModules();
    });

    describe('Inicialização do cliente MinIO', () => {
        it('deve criar cliente MinIO com configurações padrão quando todas as variáveis estão definidas', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = '9000';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';
            process.env.MINIO_USE_SSL = 'false';

            const minioConnect = require('@config/minioConnect.js').default;

            expect(MockedMinioClient).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: 9000,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin'
            });
        });

        it('deve configurar SSL corretamente quando MINIO_USE_SSL é true', () => {
            process.env.MINIO_ENDPOINT = 'minio.example.com';
            process.env.MINIO_PORT = '443';
            process.env.MINIO_ACCESS_KEY = 'access123';
            process.env.MINIO_SECRET_KEY = 'secret123';
            process.env.MINIO_USE_SSL = 'true';

            const minioConnect = require('@config/minioConnect.js').default;

            expect(MockedMinioClient).toHaveBeenCalledWith({
                endPoint: 'minio.example.com',
                port: 443,
                useSSL: true,
                accessKey: 'access123',
                secretKey: 'secret123'
            });
        });

        it('deve usar SSL false por padrão quando MINIO_USE_SSL não está definida', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = '9000';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            const minioConnect = require('@config/minioConnect.js').default;

            expect(MockedMinioClient).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: 9000,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin'
            });
        });
    });

    describe('Validação de variáveis de ambiente', () => {
        it('deve lançar erro quando MINIO_ENDPOINT não está definida', () => {
            delete process.env.MINIO_ENDPOINT;
            process.env.MINIO_PORT = '9000';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            expect(() => {
                require('@config/minioConnect.js');
            }).toThrow('Variável de ambiente para o MinIO ausente: MINIO_ENDPOINT');
        });

        it('deve lançar erro quando MINIO_PORT não está definida', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            delete process.env.MINIO_PORT;
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            expect(() => {
                require('@config/minioConnect.js');
            }).toThrow('Variável de ambiente para o MinIO ausente: MINIO_PORT');
        });

        it('deve lançar erro quando MINIO_ACCESS_KEY não está definida', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = '9000';
            delete process.env.MINIO_ACCESS_KEY;
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            expect(() => {
                require('@config/minioConnect.js');
            }).toThrow('Variável de ambiente para o MinIO ausente: MINIO_ACCESS_KEY');
        });

        it('deve lançar erro quando MINIO_SECRET_KEY não está definida', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = '9000';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            delete process.env.MINIO_SECRET_KEY;

            expect(() => {
                require('@config/minioConnect.js');
            }).toThrow('Variável de ambiente para o MinIO ausente: MINIO_SECRET_KEY');
        });
    });

    describe('Conversão de tipos', () => {
        it('deve converter MINIO_PORT para número corretamente', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = '9001';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            const minioConnect = require('@config/minioConnect.js').default;

            expect(MockedMinioClient).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: 9001,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin'
            });
        });

        it('deve lidar com porta inválida (NaN)', () => {
            process.env.MINIO_ENDPOINT = 'localhost';
            process.env.MINIO_PORT = 'invalid-port';
            process.env.MINIO_ACCESS_KEY = 'minioadmin';
            process.env.MINIO_SECRET_KEY = 'minioadmin';

            const minioConnect = require('@config/minioConnect.js').default;

            expect(MockedMinioClient).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: NaN,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin'
            });
        });
    });
});
