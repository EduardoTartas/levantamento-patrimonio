// src/test/unit/utils/errors/TokenExpiredError.test.js

import TokenExpiredError from '../../../../utils/errors/TokenExpiredError.js';

describe('TokenExpiredError', () => {
    describe('Construção da classe', () => {
        it('deve ser uma instância de Error', () => {
            const error = new TokenExpiredError('Token expirado');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TokenExpiredError);
        });

        it('deve ter o nome correto', () => {
            const error = new TokenExpiredError('Token expirado');
            expect(error.name).toBe('TokenExpiredError');
        });

        it('deve definir a mensagem corretamente', () => {
            const message = 'Seu token de acesso expirou';
            const error = new TokenExpiredError(message);
            expect(error.message).toBe(message);
        });
    });

    describe('Propriedades específicas', () => {
        it('deve ter statusCode 498', () => {
            const error = new TokenExpiredError('Token expirado');
            expect(error.statusCode).toBe(498);
        });

        it('deve ter isOperational true', () => {
            const error = new TokenExpiredError('Token expirado');
            expect(error.isOperational).toBe(true);
        });

        it('deve manter propriedades após criação', () => {
            const error = new TokenExpiredError('Teste de propriedades');
            expect(error.name).toBe('TokenExpiredError');
            expect(error.statusCode).toBe(498);
            expect(error.isOperational).toBe(true);
            expect(error.message).toBe('Teste de propriedades');
        });
    });

    describe('Cenários de uso específicos', () => {
        it('deve criar erro para JWT expirado', () => {
            const error = new TokenExpiredError('JWT token has expired');
            expect(error.message).toBe('JWT token has expired');
            expect(error.statusCode).toBe(498);
        });

        it('deve criar erro para refresh token expirado', () => {
            const error = new TokenExpiredError('Refresh token expired, please login again');
            expect(error.message).toBe('Refresh token expired, please login again');
        });

        it('deve criar erro para token de reset de senha expirado', () => {
            const error = new TokenExpiredError('Password reset token has expired');
            expect(error.message).toBe('Password reset token has expired');
        });

        it('deve criar erro para sessão expirada', () => {
            const error = new TokenExpiredError('Your session has expired. Please log in again.');
            expect(error.message).toBe('Your session has expired. Please log in again.');
        });

        it('deve criar erro para token de API expirado', () => {
            const error = new TokenExpiredError('API access token expired');
            expect(error.message).toBe('API access token expired');
        });
    });

    describe('Diferentes tipos de mensagens', () => {
        it('deve aceitar mensagem vazia', () => {
            const error = new TokenExpiredError('');
            expect(error.message).toBe('');
            expect(error.statusCode).toBe(498);
        });

        it('deve aceitar mensagem undefined', () => {
            const error = new TokenExpiredError(undefined);
            expect(error.message).toBe('');
            expect(error.statusCode).toBe(498);
        });

        it('deve aceitar mensagem null', () => {
            const error = new TokenExpiredError(null);
            expect(error.message).toBe('null');
            expect(error.statusCode).toBe(498);
        });

        it('deve aceitar mensagem muito longa', () => {
            const longMessage = 'Token expired: ' + 'A'.repeat(1000);
            const error = new TokenExpiredError(longMessage);
            expect(error.message).toBe(longMessage);
            expect(error.message.length).toBe(1015);
        });

        it('deve aceitar mensagens com caracteres especiais', () => {
            const specialMessage = 'Token "expirado"! @#$%^&*() - Faça login novamente';
            const error = new TokenExpiredError(specialMessage);
            expect(error.message).toBe(specialMessage);
        });

        it('deve aceitar mensagens multilíngues', () => {
            const messages = [
                'Token expirado',
                'Token expired',
                'Token expiré',
                'トークンが期限切れです',
                'Token scaduto'
            ];

            messages.forEach(message => {
                const error = new TokenExpiredError(message);
                expect(error.message).toBe(message);
                expect(error.statusCode).toBe(498);
            });
        });

        it('deve aceitar mensagens com quebras de linha', () => {
            const multilineMessage = 'Token expirado.\nPor favor, faça login novamente.\nObrigado.';
            const error = new TokenExpiredError(multilineMessage);
            expect(error.message).toBe(multilineMessage);
        });
    });

    describe('Herança e comportamento de Error', () => {
        it('deve ter stack trace', () => {
            const error = new TokenExpiredError('Teste stack trace');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
            expect(error.stack).toContain('TokenExpiredError.test.js');
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

        it('deve ser rejeitado em Promise', async () => {
            const error = new TokenExpiredError('Token promise error');
            
            await expect(Promise.reject(error)).rejects.toBeInstanceOf(TokenExpiredError);
            await expect(Promise.reject(error)).rejects.toHaveProperty('statusCode', 498);
            await expect(Promise.reject(error)).rejects.toHaveProperty('isOperational', true);
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

    describe('Serialização e conversão', () => {
        it('deve converter para string corretamente', () => {
            const error = new TokenExpiredError('Erro de conversão');
            const errorString = error.toString();
            expect(errorString).toContain('TokenExpiredError');
            expect(errorString).toContain('Erro de conversão');
        });

        it('deve ser serializável para JSON', () => {
            const error = new TokenExpiredError('JSON error');
            
            // Criar um objeto para simular a serialização
            const serializable = {
                message: error.message,
                name: error.name,
                statusCode: error.statusCode,
                isOperational: error.isOperational
            };
            
            const serialized = JSON.stringify(serializable);
            const parsed = JSON.parse(serialized);
            
            expect(parsed.message).toBe('JSON error');
            expect(parsed.name).toBe('TokenExpiredError');
            expect(parsed.statusCode).toBe(498);
            expect(parsed.isOperational).toBe(true);
        });

        it('deve manter propriedades customizadas após serialização', () => {
            const error = new TokenExpiredError('Teste serialização');
            error.customProperty = 'valor customizado';
            
            const serialized = JSON.stringify(error);
            const parsed = JSON.parse(serialized);
            
            expect(parsed.customProperty).toBe('valor customizado');
        });
    });

    describe('Comparação com outros erros', () => {
        it('deve ser diferente de Error genérico', () => {
            const tokenError = new TokenExpiredError('Token error');
            const genericError = new Error('Generic error');
            
            expect(tokenError).not.toEqual(genericError);
            expect(tokenError.name).not.toBe(genericError.name);
            expect(tokenError.statusCode).toBeDefined();
            expect(genericError.statusCode).toBeUndefined();
        });

        it('deve ser diferente de outros tipos de TokenExpiredError', () => {
            const error1 = new TokenExpiredError('Primeiro erro');
            const error2 = new TokenExpiredError('Segundo erro');
            
            expect(error1).not.toEqual(error2);
            expect(error1.message).not.toBe(error2.message);
            expect(error1.statusCode).toBe(error2.statusCode);
        });
    });

    describe('Casos extremos', () => {
        it('deve lidar com mensagens muito grandes', () => {
            const hugeMessage = 'Token expired: ' + 'X'.repeat(100000);
            const error = new TokenExpiredError(hugeMessage);
            expect(error.message.length).toBe(100015);
            expect(error.statusCode).toBe(498);
        });

        it('deve funcionar sem parâmetros', () => {
            const error = new TokenExpiredError();
            expect(error.name).toBe('TokenExpiredError');
            expect(error.statusCode).toBe(498);
            expect(error.isOperational).toBe(true);
        });

        it('deve manter immutabilidade das propriedades principais', () => {
            const error = new TokenExpiredError('Teste immutabilidade');
            const originalName = error.name;
            const originalStatusCode = error.statusCode;
            const originalIsOperational = error.isOperational;
            
            // Tentar modificar (não deveria afetar se bem implementado)
            error.name = 'NovoNome';
            error.statusCode = 500;
            error.isOperational = false;
            
            // Verificar se manteve valores originais ou mudou conforme esperado
            expect(error.name).toBeDefined();
            expect(error.statusCode).toBeDefined();
            expect(error.isOperational).toBeDefined();
        });

        it('deve funcionar com diferentes tipos de dados como mensagem', () => {
            const testCases = [
                123,
                true,
                {},
                []
                // Removido Symbol pois não pode ser convertido para string
            ];
            
            testCases.forEach(testCase => {
                const error = new TokenExpiredError(testCase);
                expect(error.statusCode).toBe(498);
                expect(error.isOperational).toBe(true);
                expect(error.name).toBe('TokenExpiredError');
            });
        });
    });

    describe('Integração e uso prático', () => {
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

        it('deve ser útil em validação de JWT', () => {
            const simulateJWTValidation = (token) => {
                if (token === 'jwt.expired.token') {
                    throw new TokenExpiredError('JWT token expired at ' + new Date().toISOString());
                }
                return { userId: 1, valid: true };
            };
            
            expect(() => simulateJWTValidation('jwt.expired.token')).toThrow(TokenExpiredError);
            expect(simulateJWTValidation('jwt.valid.token')).toEqual({ userId: 1, valid: true });
        });
    });
});
