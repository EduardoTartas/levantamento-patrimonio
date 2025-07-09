import TokenInvalidError from '../../../../utils/errors/TokenInvalidError.js';
import CustomError from '../../../../utils/helpers/CustomError.js';

jest.mock('../../../../utils/helpers/messages.js', () => ({
    error: {
        resourceNotFound: jest.fn((resource) => `${resource} não encontrado`)
    }
}));

import messages from '../../../../utils/helpers/messages.js';

describe('TokenInvalidError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Construção da classe', () => {
        it('deve ser uma instância de CustomError e ter propriedades corretas', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TokenInvalidError);
            expect(error.name).toBe('CustomError');
            expect(error.message).toBe('Token inválido');
            expect(error.statusCode).toBe(401);
            expect(error.errorType).toBe('invalidToken');
            expect(error.field).toBe('Token');
            expect(error.details).toEqual([]);
        });
    });

    describe('Mensagens e construtor', () => {
        it('deve usar mensagem padrão quando não fornecida', () => {
            const testCases = [null, undefined, ''];
            
            testCases.forEach(testCase => {
                const error = new TokenInvalidError(testCase);
                expect(error.message).toBe('Token não encontrado');
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('invalidToken');
            });
        });

        it('deve aceitar mensagem personalizada', () => {
            const customMessage = 'Token JWT malformado';
            const error = new TokenInvalidError(customMessage);
            expect(error.message).toBe(customMessage);
            expect(messages.error.resourceNotFound).not.toHaveBeenCalled();
        });

        it('deve funcionar sem parâmetros', () => {
            const error = new TokenInvalidError();
            expect(error.message).toBe('Token não encontrado');
            expect(error.statusCode).toBe(401);
            expect(error.errorType).toBe('invalidToken');
        });
    });

    describe('Herança e comportamento de Error', () => {
        it('deve ter stack trace', () => {
            const error = new TokenInvalidError('Teste stack');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });

        it('deve ser capturado por try-catch', () => {
            let caughtError = null;
            
            try {
                throw new TokenInvalidError('Erro para captura');
            } catch (error) {
                caughtError = error;
            }
            
            expect(caughtError).toBeInstanceOf(TokenInvalidError);
            expect(caughtError.message).toBe('Erro para captura');
            expect(caughtError.statusCode).toBe(401);
        });

        it('deve funcionar com async/await', async () => {
            const throwError = async () => {
                throw new TokenInvalidError('Async error');
            };

            try {
                await throwError();
                fail('Deveria ter lançado erro');
            } catch (error) {
                expect(error).toBeInstanceOf(TokenInvalidError);
                expect(error.message).toBe('Async error');
            }
        });
    });

    describe('Integração com messages helper', () => {
        it('deve integrar com messages helper corretamente', () => {
            const error1 = new TokenInvalidError();
            expect(messages.error.resourceNotFound).toHaveBeenCalledWith('Token');
            expect(error1.message).toBe('Token não encontrado');
            
            messages.error.resourceNotFound.mockClear();
            const error2 = new TokenInvalidError('Mensagem fornecida');
            expect(messages.error.resourceNotFound).not.toHaveBeenCalled();
        });
    });

    describe('Uso prático', () => {
        it('deve ser útil em validação de JWT', () => {
            const validateJWT = (token) => {
                if (!token || !token.includes('.')) {
                    throw new TokenInvalidError('JWT must contain 3 parts separated by dots');
                }
                return { valid: true };
            };
            
            expect(() => validateJWT('')).toThrow(TokenInvalidError);
            expect(() => validateJWT('invalid')).toThrow(TokenInvalidError);
            expect(validateJWT('header.payload.signature')).toEqual({ valid: true });
        });

        it('deve ser útil em middleware de autorização', () => {
            const authMiddleware = (authHeader) => {
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new TokenInvalidError('Authorization header must start with "Bearer "');
                }
                const token = authHeader.substring(7);
                if (!token) {
                    throw new TokenInvalidError('Token is required after Bearer');
                }
                return { token, valid: true };
            };
            
            expect(() => authMiddleware('')).toThrow(TokenInvalidError);
            expect(() => authMiddleware('Basic token')).toThrow(TokenInvalidError);
            expect(() => authMiddleware('Bearer ')).toThrow(TokenInvalidError);
            expect(authMiddleware('Bearer valid-token')).toEqual({ 
                token: 'valid-token', 
                valid: true 
            });
        });
    });
});
