jest.mock('winston-daily-rotate-file', () => {
    const TransportStream = require('winston-transport');

    return {
        __esModule: true,
        default: class MockDailyRotateFile extends TransportStream {
            constructor(options) {
                super(options);
                this.options = options;
            }

            log(info, callback) {
                callback();
            }
        },
    };
});

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { transports } = require('winston');

dotenv.config();

describe('Utilitário de Logger', () => {
    const originalEnv = { ...process.env };
    const logDirectory = path.resolve(process.cwd(), 'logs');

    let getTotalLogSize;
    let ensureLogSizeLimit;
    let logIntervalId;
    let maxLogSize;
    let logger;

    beforeAll(() => {
        jest.spyOn(transports, 'Console').mockImplementation(() => ({
            log: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
        }));

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.useFakeTimers();

        delete global.loggerListenersSet;

        jest.resetModules();

        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'readdirSync');
        jest.spyOn(fs, 'statSync');
        jest.spyOn(fs, 'unlinkSync');
        jest.spyOn(fs, 'mkdirSync');

        process.env.NODE_ENV = 'test';
        process.env.LOG_ENABLED = 'true';

        jest.spyOn(process, 'exit').mockImplementation(() => { });

        const loggerImport = require('@utils/logger.js');
        getTotalLogSize = loggerImport.getTotalLogSize;
        ensureLogSizeLimit = loggerImport.ensureLogSizeLimit;
        logIntervalId = loggerImport.logIntervalId;
        maxLogSize = loggerImport.maxLogSize;
        logger = loggerImport.default;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        jest.restoreAllMocks();
        jest.clearAllTimers();
        delete global.loggerListenersSet;
    });

    describe('getTotalLogSize', () => {
        it('deve retornar 0 se o diretório de logs não existir', () => {
            fs.existsSync.mockReturnValue(false);

            const totalSize = getTotalLogSize(logDirectory);
            expect(totalSize).toBe(0);
        });

        it('deve calcular o tamanho total dos arquivos de log', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['file1.log', 'file2.log']);
            fs.statSync.mockImplementation((filePath) => {
                if (filePath.endsWith('file1.log')) return { size: 100 };
                if (filePath.endsWith('file2.log')) return { size: 200 };
                return { size: 0 };
            });

            const totalSize = getTotalLogSize(logDirectory);
            expect(totalSize).toBe(300);
        });

        it('deve lançar erro se fs.statSync falhar', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['file1.log']);
            fs.statSync.mockImplementation(() => { throw new Error('Erro no statSync'); });

            expect(() => getTotalLogSize(logDirectory)).toThrow('Erro no statSync');
        });
    });

    describe('ensureLogSizeLimit', () => {
        it('deve remover arquivos mais antigos até respeitar o limite', () => {
            fs.readdirSync.mockReturnValue(['file1.log', 'file2.log', 'file3.log']);
            fs.statSync.mockImplementation((filePath) => {
                if (filePath.endsWith('file1.log')) return { size: 50, mtime: new Date(2021, 1, 1) };
                if (filePath.endsWith('file2.log')) return { size: 50, mtime: new Date(2021, 1, 2) };
                if (filePath.endsWith('file3.log')) return { size: 100, mtime: new Date(2021, 1, 3) };
                return { size: 0, mtime: new Date() };
            });
            fs.unlinkSync.mockImplementation(() => { });

            ensureLogSizeLimit(logDirectory, 150);

            expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
            expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(logDirectory, 'file1.log'));
        });

        it('não deve remover arquivos se estiver dentro do limite', () => {
            fs.readdirSync.mockReturnValue(['file1.log', 'file2.log']);
            fs.statSync.mockImplementation((filePath) => {
                if (filePath.endsWith('file1.log')) return { size: 100, mtime: new Date() };
                if (filePath.endsWith('file2.log')) return { size: 100, mtime: new Date() };
                return { size: 0, mtime: new Date() };
            });
            fs.unlinkSync.mockImplementation(() => {});

            ensureLogSizeLimit(logDirectory, 300);

            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });

        it('deve propagar erro de sistema de arquivos', () => {
            fs.readdirSync.mockImplementation(() => { throw new Error('Erro no readdirSync'); });

            expect(() => ensureLogSizeLimit(logDirectory, 150)).toThrow('Erro no readdirSync');
        });
    });

    describe('Configuração do Logger', () => {
        it('deve criar logger com transports corretos quando habilitado', () => {
            const loggerTransports = logger.transports.map(transport => transport.constructor.name);
            expect(loggerTransports).toEqual(expect.arrayContaining(['Console', 'MockDailyRotateFile']));
        });

        it('deve criar diretório de logs se não existir', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => { });

            jest.resetModules();
            process.env.NODE_ENV = 'test';
            process.env.LOG_ENABLED = 'true';
            const loggerImport = require('@utils/logger.js');
            logger = loggerImport.default;

            expect(fs.mkdirSync).toHaveBeenCalledWith(logDirectory, { recursive: true });
        });

        it('não deve adicionar transports se logEnabled for false', () => {
            process.env.LOG_ENABLED = 'false';
            jest.resetModules();
            process.env.NODE_ENV = 'test';
            const loggerImport = require('@utils/logger.js');
            logger = loggerImport.default;

            expect(logger.transports.length).toBe(0);
        });
    });

    describe('Configuração do Tamanho Máximo e Nível de Log', () => {
        it('deve usar valores padrão quando variáveis não estão definidas', () => {
            delete process.env.LOG_MAX_SIZE_GB;
            delete process.env.LOG_LEVEL;
            jest.resetModules();
            process.env.NODE_ENV = 'test';
            process.env.LOG_ENABLED = 'true';
            const loggerImport = require('@utils/logger.js');
            maxLogSize = loggerImport.maxLogSize;
            logger = loggerImport.default;

            expect(maxLogSize).toBe(50 * 1024 * 1024 * 1024);
            expect(logger.level).toBe('info');
        });

        it('deve usar valores customizados quando definidos', () => {
            process.env.LOG_MAX_SIZE_GB = '10';
            process.env.LOG_LEVEL = 'debug';
            jest.resetModules();
            process.env.NODE_ENV = 'test';
            process.env.LOG_ENABLED = 'true';
            const loggerImport = require('@utils/logger.js');
            maxLogSize = loggerImport.maxLogSize;
            logger = loggerImport.default;

            expect(maxLogSize).toBe(10 * 1024 * 1024 * 1024);
            expect(logger.level).toBe('debug');
        });

        it('deve lançar erro quando LOG_MAX_SIZE_GB é inválida', () => {
            process.env.LOG_MAX_SIZE_GB = 'invalid';
            jest.resetModules();
            process.env.NODE_ENV = 'test';
            process.env.LOG_ENABLED = 'true';

            expect(() => {
                require('@utils/logger.js');
            }).toThrow('LOG_MAX_SIZE_GB deve ser um número positivo');
        });
    });

    describe('Handlers de Exceções', () => {
        let errorSpy;
        let exitSpy;
        let uncaughtExceptionHandler;
        let unhandledRejectionHandler;

        beforeEach(() => {
            process.env.LOG_ENABLED = 'true';
            process.env.NODE_ENV = 'production';

            const handlers = {};
            jest.spyOn(process, 'on').mockImplementation((event, handler) => {
                handlers[event] = handler;
            });

            jest.resetModules();
            const loggerImport = require('@utils/logger.js');
            logger = loggerImport.default;

            uncaughtExceptionHandler = handlers['uncaughtException'];
            unhandledRejectionHandler = handlers['unhandledRejection'];

            errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => { });
            exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });
        });

        afterEach(() => {
            errorSpy.mockRestore();
            exitSpy.mockRestore();
            delete global.loggerListenersSet;
        });

        it('deve logar e encerrar processo em uncaughtException', () => {
            const testError = new Error('Teste de uncaughtException');

            expect(uncaughtExceptionHandler).toBeDefined();
            uncaughtExceptionHandler(testError);

            expect(errorSpy).toHaveBeenCalledWith('Uncaught Exception:', testError);
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it('deve logar unhandledRejection', () => {
            const reason = 'Razão da rejeição';
            const promise = Promise.reject(reason);

            promise.catch(() => { });

            expect(unhandledRejectionHandler).toBeDefined();
            unhandledRejectionHandler(reason, promise);

            expect(errorSpy).toHaveBeenCalledWith('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    });
});
