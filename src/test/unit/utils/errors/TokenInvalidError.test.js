// src/test/unit/utils/errors/TokenInvalidError.test.js

import TokenInvalidError from '../../../../utils/errors/TokenInvalidError.js';
import CustomError from '../../../../utils/helpers/CustomError.js';

// Mock do messages
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
        it('deve ser uma instância de CustomError', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(Error);
        });

        it('deve ser uma instância de TokenInvalidError', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error).toBeInstanceOf(TokenInvalidError);
        });

        it('deve ter o nome correto herdado de CustomError', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error.name).toBe('CustomError');
        });
    });

    describe('Propriedades padrão', () => {
        it('deve ter statusCode 401', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error.statusCode).toBe(401);
        });

        it('deve ter errorType invalidToken', () => {
            const error = new TokenInvalidError('Token malformado');
            expect(error.errorType).toBe('invalidToken');
        });

        it('deve ter field Token', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error.field).toBe('Token');
        });

        it('deve ter details como array vazio', () => {
            const error = new TokenInvalidError('Token inválido');
            expect(error.details).toEqual([]);
            expect(Array.isArray(error.details)).toBe(true);
        });
    });

    describe('Construtor com mensagem personalizada', () => {
        it('deve aceitar mensagem personalizada', () => {
            const customMessage = 'Token JWT malformado';
            const error = new TokenInvalidError(customMessage);
            expect(error.message).toBe(customMessage);
        });

        it('deve usar mensagem personalizada em vez da padrão', () => {
            const customMessage = 'Formato de token inválido';
            const error = new TokenInvalidError(customMessage);
            expect(error.message).toBe(customMessage);
            expect(messages.error.resourceNotFound).not.toHaveBeenCalled();
        });

        it('deve manter outras propriedades com mensagem personalizada', () => {
            const error = new TokenInvalidError('Mensagem customizada');
            expect(error.statusCode).toBe(401);
            expect(error.errorType).toBe('invalidToken');
            expect(error.field).toBe('Token');
            expect(error.details).toEqual([]);
        });
    });

    describe('Construtor sem parâmetros', () => {
        it('deve usar mensagem padrão quando message é null, undefined ou não fornecido', () => {
            const testCases = [null, undefined, ''];
            
            testCases.forEach(testCase => {
                const error = new TokenInvalidError(testCase);
                expect(error.message).toBe('Token não encontrado');
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('invalidToken');
            });
        });
    });

    describe('Cenários de uso específicos', () => {
        it('deve criar erro para JWT malformado', () => {
            const error = new TokenInvalidError('JWT token is malformed');
            expect(error.message).toBe('JWT token is malformed');
            expect(error.errorType).toBe('invalidToken');
        });

        it('deve criar erro para token com formato inválido', () => {
            const error = new TokenInvalidError('Token deve ter formato Bearer <token>');
            expect(error.message).toBe('Token deve ter formato Bearer <token>');
            expect(error.field).toBe('Token');
        });

        it('deve criar erro para assinatura inválida', () => {
            const error = new TokenInvalidError('Token signature verification failed');
            expect(error.message).toBe('Token signature verification failed');
            expect(error.statusCode).toBe(401);
        });

        it('deve criar erro para token com claims inválidos', () => {
            const error = new TokenInvalidError('Token contains invalid claims');
            expect(error.message).toBe('Token contains invalid claims');
        });

        it('deve criar erro para refresh token inválido', () => {
            const error = new TokenInvalidError('Refresh token is invalid or revoked');
            expect(error.message).toBe('Refresh token is invalid or revoked');
        });
    });

    describe('Diferentes tipos de mensagens', () => {
        it('deve aceitar mensagem vazia e usar padrão', () => {
            const error = new TokenInvalidError('');
            expect(error.message).toBe('Token não encontrado');
            expect(error.statusCode).toBe(401);
        });

        it('deve aceitar mensagens especiais e multilíngues', () => {
            const testCases = [
                'Token "inválido"! @#$%^&*()',
                'Token inválido.\nVerifique formato.',
                'トークンが無効です'
            ];

            testCases.forEach(message => {
                const error = new TokenInvalidError(message);
                expect(error.message).toBe(message);
                expect(error.statusCode).toBe(401);
            });
        });
    });

    describe('Herança de CustomError', () => {
        it('deve ter todas as propriedades de CustomError', () => {
            const error = new TokenInvalidError('Teste herança');
            expect(error.statusCode).toBeDefined();
            expect(error.errorType).toBeDefined();
            expect(error.field).toBeDefined();
            expect(error.details).toBeDefined();
        });

        it('deve ter stack trace', () => {
            const error = new TokenInvalidError('Teste stack');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
            expect(error.stack).toContain('TokenInvalidError.test.js');
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

        it('deve ser rejeitado em Promise', async () => {
            const error = new TokenInvalidError('Promise error');
            
            await expect(Promise.reject(error)).rejects.toBeInstanceOf(TokenInvalidError);
            await expect(Promise.reject(error)).rejects.toHaveProperty('statusCode', 401);
            await expect(Promise.reject(error)).rejects.toHaveProperty('errorType', 'invalidToken');
        });
    });

    describe('Integração e Serialização', () => {
        it('deve integrar com messages helper corretamente', () => {
            const error1 = new TokenInvalidError();
            expect(messages.error.resourceNotFound).toHaveBeenCalledWith('Token');
            expect(error1.message).toBe('Token não encontrado');
            
            messages.error.resourceNotFound.mockClear();
            const error2 = new TokenInvalidError('Mensagem fornecida');
            expect(messages.error.resourceNotFound).not.toHaveBeenCalled();
        });

        it('deve converter para string e JSON corretamente', () => {
            const error = new TokenInvalidError('Teste conversão');
            
            // Teste string
            expect(error.toString()).toContain('CustomError');
            
            // Teste JSON
            const serializable = {
                message: error.message,
                statusCode: error.statusCode,
                errorType: error.errorType,
                field: error.field
            };
            const parsed = JSON.parse(JSON.stringify(serializable));
            expect(parsed.message).toBe('Teste conversão');
            expect(parsed.statusCode).toBe(401);
        });
    });

    describe('Casos extremos', () => {
        it('deve lidar com valores falsy para message', () => {
            const falsyValues = [null, undefined, false, 0, ''];
            
            falsyValues.forEach((value, index) => {
                // CustomError sempre usa mensagem padrão do helper para valores falsy
                const error = new TokenInvalidError(value);
                expect(error.message).toBe('Token não encontrado');
                expect(error.statusCode).toBe(401);
            });
        });        it('deve funcionar com diferentes tipos de dados como mensagem', () => {
            const testCases = [
                { input: 123, expected: '123' },
                { input: true, expected: 'true' },
                { input: {}, expected: '[object Object]' },
                { input: [], expected: '' }
            ];

            testCases.forEach(({ input, expected }) => {
                const error = new TokenInvalidError(input);
                expect(error.message).toBe(expected);
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('invalidToken');
            });
        });

        it('deve manter consistência em múltiplas instanciações', () => {
            const errors = Array.from({ length: 10 }, (_, i) => 
                new TokenInvalidError(`Error ${i}`)
            );
            
            errors.forEach((error, index) => {
                expect(error.message).toBe(`Error ${index}`);
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('invalidToken');
                expect(error.field).toBe('Token');
                expect(error.details).toEqual([]);
            });
        });
    });

    describe('Integração e uso prático', () => {
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

        it('deve fornecer informações úteis para tratamento de erro', () => {
            try {
                throw new TokenInvalidError('Token signature mismatch');
            } catch (error) {
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('invalidToken');
                expect(error.field).toBe('Token');
                expect(error.message).toBe('Token signature mismatch');
                
                // Útil para resposta HTTP
                const response = {
                    status: error.statusCode,
                    error: {
                        type: error.errorType,
                        field: error.field,
                        message: error.message,
                        details: error.details
                    }
                };
                
                expect(response.status).toBe(401);
                expect(response.error.type).toBe('invalidToken');
            }
        });
    });
});
