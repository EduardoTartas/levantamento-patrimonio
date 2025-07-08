import TokenExpiredError from '../../../../utils/errors/TokenExpiredError.js';

describe('TokenExpiredError', () => {
    describe('Construção da classe', () => {
        it('deve ser uma instância de Error', () => {
            const error = new TokenExpiredError('Token expirado');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TokenExpiredError);
        });

        it('deve ter propriedades corretas', () => {
            const message = 'Seu token de acesso expirou';
            const error = new TokenExpiredError(message);
            expect(error.name).toBe('TokenExpiredError');
            expect(error.message).toBe(message);
            expect(error.statusCode).toBe(498);
            expect(error.isOperational).toBe(true);
        });
    });

    describe('Diferentes tipos de mensagens', () => {
        it('deve aceitar mensagem undefined', () => {
            const error = new TokenExpiredError(undefined);
            expect(error.message).toBe('');
            expect(error.statusCode).toBe(498);
        });

        it('deve aceitar mensagem vazia', () => {
            const error = new TokenExpiredError('');
            expect(error.message).toBe('');
            expect(error.statusCode).toBe(498);
        });

        it('deve funcionar sem parâmetros', () => {
            const error = new TokenExpiredError();
            expect(error.name).toBe('TokenExpiredError');
            expect(error.statusCode).toBe(498);
            expect(error.isOperational).toBe(true);
        });
    });

    describe('Herança e comportamento de Error', () => {
        it('deve ter stack trace', () => {
            const error = new TokenExpiredError('Teste stack trace');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });

        it('deve ser capturado por try-catch', () => {
            let caughtError = null;
            
            try {
                throw new TokenExpiredError('Erro para captura');
            } catch (error) {
                caughtError = error;
            }
            
            expect(caughtError).toBeInstanceOf(TokenExpiredError);
            expect(caughtError.message).toBe('Erro para captura');
            expect(caughtError.statusCode).toBe(498);
        });

        it('deve funcionar com async/await', async () => {
            const throwError = async () => {
                throw new TokenExpiredError('Async error');
            };

            try {
                await throwError();
                fail('Deveria ter lançado erro');
            } catch (error) {
                expect(error).toBeInstanceOf(TokenExpiredError);
                expect(error.message).toBe('Async error');
            }
        });
    });

    describe('Uso prático', () => {
        it('deve ser útil em middleware de autenticação', () => {
            const simulateAuthMiddleware = (token) => {
                if (!token || token === 'expired') {
                    throw new TokenExpiredError('Authentication token has expired');
                }
                return true;
            };
            
            expect(() => simulateAuthMiddleware('expired')).toThrow(TokenExpiredError);
            expect(() => simulateAuthMiddleware(null)).toThrow(TokenExpiredError);
            expect(simulateAuthMiddleware('valid-token')).toBe(true);
        });
    });
});
