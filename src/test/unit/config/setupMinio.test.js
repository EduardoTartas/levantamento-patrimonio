import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock do minioClient
const mockMinioClient = {
    bucketExists: jest.fn(),
    makeBucket: jest.fn()
};

// Mock do logger
const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
};

// Mock do process.exit que interrompe a execução
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process exit called with code ${code}`);
});

jest.mock('@config/minioConnect.js', () => mockMinioClient);
jest.mock('@utils/logger.js', () => mockLogger);

describe('setupMinio', () => {
    let originalEnv;
    let setupMinio;

    beforeEach(async () => {
        originalEnv = { ...process.env };
        
        jest.clearAllMocks();
        
        mockMinioClient.bucketExists.mockResolvedValue(false);
        mockMinioClient.makeBucket.mockResolvedValue();
        
        const module = await import('@config/setupMinio.js');
        setupMinio = module.default;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Configuração de bucket', () => {
        it('deve criar bucket quando não existe', async () => {
            process.env.MINIO_BUCKET_FOTOS = 'fotos-test';
            mockMinioClient.bucketExists.mockResolvedValue(false);

            await setupMinio();

            expect(mockLogger.info).toHaveBeenCalledWith('Verificando a existência do bucket: fotos-test');
            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('fotos-test');
            expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('fotos-test');
            expect(mockLogger.info).toHaveBeenCalledWith('Bucket "fotos-test" criado com sucesso no MinIO.');
        });

        it('deve usar bucket existente quando já existe', async () => {
            process.env.MINIO_BUCKET_FOTOS = 'fotos-existing';
            mockMinioClient.bucketExists.mockResolvedValue(true);

            await setupMinio();

            expect(mockLogger.info).toHaveBeenCalledWith('Verificando a existência do bucket: fotos-existing');
            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('fotos-existing');
            expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Bucket "fotos-existing" já existe no MinIO.');
        });
    });

    describe('Validação de variáveis de ambiente', () => {
        it('deve falhar quando MINIO_BUCKET_FOTOS não está definida', async () => {
            delete process.env.MINIO_BUCKET_FOTOS;

            await expect(setupMinio()).rejects.toThrow('Process exit called with code 1');

            expect(mockLogger.error).toHaveBeenCalledWith('Nome do bucket do MinIO não definido na variável de ambiente MINIO_BUCKET_FOTOS.');
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('deve falhar quando MINIO_BUCKET_FOTOS está vazia', async () => {
            process.env.MINIO_BUCKET_FOTOS = '';

            await expect(setupMinio()).rejects.toThrow('Process exit called with code 1');

            expect(mockLogger.error).toHaveBeenCalledWith('Nome do bucket do MinIO não definido na variável de ambiente MINIO_BUCKET_FOTOS.');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('Tratamento de erros', () => {
        it('deve tratar erro ao verificar existência do bucket', async () => {
            process.env.MINIO_BUCKET_FOTOS = 'fotos-error';
            const error = new Error('Conexão falhou');
            mockMinioClient.bucketExists.mockRejectedValue(error);

            await expect(setupMinio()).rejects.toThrow('Process exit called with code 1');

            expect(mockLogger.error).toHaveBeenCalledWith('Erro ao configurar o bucket do MinIO: Conexão falhou');
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('deve tratar erro ao criar bucket', async () => {
            process.env.MINIO_BUCKET_FOTOS = 'fotos-create-error';
            mockMinioClient.bucketExists.mockResolvedValue(false);
            const error = new Error('Erro na criação do bucket');
            mockMinioClient.makeBucket.mockRejectedValue(error);

            await expect(setupMinio()).rejects.toThrow('Process exit called with code 1');

            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('fotos-create-error');
            expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('fotos-create-error');
            expect(mockLogger.error).toHaveBeenCalledWith('Erro ao configurar o bucket do MinIO: Erro na criação do bucket');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });
});
