// src/test/unit/utils/errors/AuthenticationError.test.js

import AuthenticationError from '../../../../utils/errors/AuthenticationError.js';
import CustomError from '../../../../utils/helpers/CustomError.js';

describe('AuthenticationError', () => {
    describe('Construção da classe', () => {
        it('deve ser uma instância de CustomError', () => {
            const error = new AuthenticationError('Erro de autenticação');
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(Error);
        });

        it('deve ter o nome correto', () => {
            const error = new AuthenticationError('Erro de autenticação');
            expect(error.name).toBe('CustomError');
        });

        it('deve ser uma instância de AuthenticationError', () => {
            const error = new AuthenticationError('Erro de autenticação');
            expect(error).toBeInstanceOf(AuthenticationError);
        });
    });

    describe('Propriedades padrão', () => {
        it('deve ter statusCode 401', () => {
            const error = new AuthenticationError('Credenciais inválidas');
            expect(error.statusCode).toBe(401);
        });

        it('deve ter errorType authentication', () => {
            const error = new AuthenticationError('Token inválido');
            expect(error.errorType).toBe('authentication');
        });

        it('deve definir a mensagem corretamente', () => {
            const message = 'Usuário não autenticado';
            const error = new AuthenticationError(message);
            expect(error.message).toBe(message);
        });

        it('deve ter field null por padrão', () => {
            const error = new AuthenticationError('Erro padrão');
            expect(error.field).toBeNull();
        });

        it('deve ter details null por padrão', () => {
            const error = new AuthenticationError('Erro padrão');
            expect(error.details).toBeNull();
        });
    });

    describe('Construtor com parâmetros opcionais', () => {
        it('deve aceitar field personalizado', () => {
            const message = 'Email inválido';
            const field = 'email';
            const error = new AuthenticationError(message, field);
            
            expect(error.message).toBe(message);
            expect(error.field).toBe(field);
            expect(error.details).toBeNull();
        });

        it('deve aceitar details personalizados', () => {
            const message = 'Múltiplos erros de validação';
            const field = 'credentials';
            const details = ['Email formato inválido', 'Senha muito fraca'];
            const error = new AuthenticationError(message, field, details);
            
            expect(error.message).toBe(message);
            expect(error.field).toBe(field);
            expect(error.details).toBe(details);
        });

        it('deve aceitar todos os parâmetros', () => {
            const message = 'Falha na autenticação';
            const field = 'token';
            const details = { attempts: 3, lastAttempt: '2025-07-02' };
            const error = new AuthenticationError(message, field, details);
            
            expect(error.message).toBe(message);
            expect(error.statusCode).toBe(401);
            expect(error.errorType).toBe('authentication');
            expect(error.field).toBe(field);
            expect(error.details).toBe(details);
        });
    });

    describe('Cenários de uso específicos', () => {
        it('deve criar erro para credenciais inválidas', () => {
            const error = new AuthenticationError('Credenciais inválidas', 'credentials');
            
            expect(error.message).toBe('Credenciais inválidas');
            expect(error.statusCode).toBe(401);
            expect(error.field).toBe('credentials');
        });

        it('deve criar erro para token ausente', () => {
            const error = new AuthenticationError('Token de autorização não fornecido', 'authorization');
            
            expect(error.message).toBe('Token de autorização não fornecido');
            expect(error.field).toBe('authorization');
        });

        it('deve criar erro para sessão expirada', () => {
            const error = new AuthenticationError(
                'Sessão expirada', 
                'session', 
                { expiredAt: '2025-07-02T10:00:00Z' }
            );
            
            expect(error.message).toBe('Sessão expirada');
            expect(error.field).toBe('session');
            expect(error.details).toEqual({ expiredAt: '2025-07-02T10:00:00Z' });
        });

        it('deve criar erro para usuário bloqueado', () => {
            const details = {
                userId: 123,
                blockedUntil: '2025-07-03T00:00:00Z',
                reason: 'Múltiplas tentativas de login falharam'
            };
            const error = new AuthenticationError('Usuário temporariamente bloqueado', 'user', details);
            
            expect(error.message).toBe('Usuário temporariamente bloqueado');
            expect(error.field).toBe('user');
            expect(error.details).toBe(details);
        });
    });

    describe('Diferentes tipos de mensagens', () => {
        it('deve aceitar mensagem vazia', () => {
            const error = new AuthenticationError('');
            expect(error.message).toBe('An error occurred'); // CustomError usa '' || 'An error occurred'
            expect(error.statusCode).toBe(401);
        });

        it('deve aceitar mensagem muito longa', () => {
            const longMessage = 'A'.repeat(500);
            const error = new AuthenticationError(longMessage);
            expect(error.message).toBe(longMessage);
            expect(error.message.length).toBe(500);
        });

        it('deve aceitar mensagens com caracteres especiais', () => {
            const specialMessage = 'Erro: "Autenticação" falhou! @#$%^&*()';
            const error = new AuthenticationError(specialMessage);
            expect(error.message).toBe(specialMessage);
        });

        it('deve aceitar mensagens com quebras de linha', () => {
            const multilineMessage = 'Erro de autenticação:\nCredenciais inválidas\nTente novamente';
            const error = new AuthenticationError(multilineMessage);
            expect(error.message).toBe(multilineMessage);
        });
    });

    describe('Diferentes tipos de field', () => {
        it('deve aceitar field como string', () => {
            const error = new AuthenticationError('Erro', 'email');
            expect(error.field).toBe('email');
        });

        it('deve aceitar field como null explícito', () => {
            const error = new AuthenticationError('Erro', null);
            expect(error.field).toBeNull();
        });

        it('deve aceitar field como undefined', () => {
            const error = new AuthenticationError('Erro', undefined);
            expect(error.field).toBeNull(); // CustomError converte undefined para null por padrão
        });
    });

    describe('Diferentes tipos de details', () => {
        it('deve aceitar details como array', () => {
            const details = ['erro1', 'erro2', 'erro3'];
            const error = new AuthenticationError('Múltiplos erros', 'form', details);
            expect(error.details).toBe(details);
            expect(Array.isArray(error.details)).toBe(true);
        });

        it('deve aceitar details como objeto', () => {
            const details = { code: 'AUTH001', timestamp: Date.now() };
            const error = new AuthenticationError('Erro codificado', 'system', details);
            expect(error.details).toBe(details);
            expect(typeof error.details).toBe('object');
        });

        it('deve aceitar details como string', () => {
            const details = 'Informação adicional sobre o erro';
            const error = new AuthenticationError('Erro com info', 'info', details);
            expect(error.details).toBe(details);
            expect(typeof error.details).toBe('string');
        });

        it('deve aceitar details como número', () => {
            const details = 404;
            const error = new AuthenticationError('Erro numérico', 'code', details);
            expect(error.details).toBe(details);
            expect(typeof error.details).toBe('number');
        });
    });

    describe('Herança e comportamento de Error', () => {
        it('deve ter stack trace', () => {
            const error = new AuthenticationError('Teste stack');
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
            expect(error.stack).toContain('AuthenticationError.test.js');
        });

        it('deve ser capturado por try-catch', () => {
            let caughtError = null;
            
            try {
                throw new AuthenticationError('Erro para captura');
            } catch (error) {
                caughtError = error;
            }
            
            expect(caughtError).toBeInstanceOf(AuthenticationError);
            expect(caughtError.message).toBe('Erro para captura');
        });

        it('deve ser rejeitado em Promise', async () => {
            const error = new AuthenticationError('Erro de promise');
            
            await expect(Promise.reject(error)).rejects.toBeInstanceOf(AuthenticationError);
            await expect(Promise.reject(error)).rejects.toHaveProperty('statusCode', 401);
        });
    });

    describe('Serialização e toString', () => {
        it('deve converter para string corretamente', () => {
            const error = new AuthenticationError('Erro de conversão');
            const errorString = error.toString();
            expect(errorString).toContain('CustomError');
            expect(errorString).toContain('Erro de conversão');
        });

        it('deve ser serializável para JSON', () => {
            const error = new AuthenticationError('Erro JSON', 'field', { extra: 'data' });
            const serialized = JSON.stringify(error);
            const parsed = JSON.parse(serialized);
            
            // CustomError não implementa toJSON, então só propriedades enumeráveis são serializadas
            expect(parsed).toHaveProperty('statusCode', 401);
            expect(parsed).toHaveProperty('errorType', 'authentication');
            expect(parsed).toHaveProperty('field', 'field');
        });
    });

    describe('Casos extremos', () => {
        it('deve lidar com valores falsy para message', () => {
            const falsyValues = [null, undefined, false, 0, ''];
            
            falsyValues.forEach(value => {
                const error = new AuthenticationError(value);
                expect(error.statusCode).toBe(401);
                expect(error.errorType).toBe('authentication');
                // CustomError usa || 'An error occurred' para valores falsy
                if (value === null || value === undefined || value === false || value === 0 || value === '') {
                    expect(error.message).toBe('An error occurred');
                }
            });
        });

        it('deve manter referências para objetos complexos em details', () => {
            const complexDetails = {
                user: { id: 1, name: 'Test' },
                attempts: [1, 2, 3],
                metadata: { timestamp: new Date() }
            };
            
            const error = new AuthenticationError('Erro complexo', 'complex', complexDetails);
            expect(error.details).toBe(complexDetails);
            expect(error.details.user.name).toBe('Test');
        });
    });
});
