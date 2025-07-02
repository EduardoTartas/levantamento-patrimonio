import TokenUtil from '../../../utils/TokenUtil.js';
import jwt from 'jsonwebtoken';

// Mock do jwt
jest.mock('jsonwebtoken');

describe('TokenUtil', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
        
        // Configurar variáveis de ambiente padrão
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.JWT_EXPIRES_IN = '15m';
        process.env.JWT_REFRESH_EXPIRE_IN = '7d';
        
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe('generateAccessToken', () => {
        it('deve gerar access token com sucesso', () => {
            const userId = '64a8b123456789012345678a';
            const expectedToken = 'generated-access-token';
            
            jwt.sign.mockReturnValue(expectedToken);

            const result = TokenUtil.generateAccessToken(userId);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: userId },
                'test-secret-key',
                { expiresIn: '15m' }
            );
            expect(result).toBe(expectedToken);
        });

        it('deve gerar tokens diferentes para IDs diferentes', () => {
            const token1 = 'token-1';
            const token2 = 'token-2';
            
            jwt.sign.mockReturnValueOnce(token1).mockReturnValueOnce(token2);

            const result1 = TokenUtil.generateAccessToken('user1');
            const result2 = TokenUtil.generateAccessToken('user2');

            expect(result1).toBe(token1);
            expect(result2).toBe(token2);
            expect(jwt.sign).toHaveBeenCalledTimes(2);
        });

        it('deve usar variáveis de ambiente corretas', () => {
            process.env.JWT_SECRET = 'custom-secret';
            process.env.JWT_EXPIRES_IN = '30m';
            
            TokenUtil.generateAccessToken('test-id');

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'test-id' },
                'custom-secret',
                { expiresIn: '30m' }
            );
        });

        it('deve tratar ID como string vazia', () => {
            TokenUtil.generateAccessToken('');

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: '' },
                'test-secret-key',
                { expiresIn: '15m' }
            );
        });

        it('deve tratar ID como null', () => {
            TokenUtil.generateAccessToken(null);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: null },
                'test-secret-key',
                { expiresIn: '15m' }
            );
        });

        it('deve tratar ID como undefined', () => {
            TokenUtil.generateAccessToken(undefined);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: undefined },
                'test-secret-key',
                { expiresIn: '15m' }
            );
        });

        it('deve propagar erro do jwt.sign', () => {
            const error = new Error('JWT Error');
            jwt.sign.mockImplementation(() => {
                throw error;
            });

            expect(() => TokenUtil.generateAccessToken('test-id')).toThrow('JWT Error');
        });
    });

    describe('generateRefreshToken', () => {
        it('deve gerar refresh token com sucesso', () => {
            const userId = '64a8b123456789012345678b';
            const expectedToken = 'generated-refresh-token';
            
            jwt.sign.mockReturnValue(expectedToken);

            const result = TokenUtil.generateRefreshToken(userId);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: userId },
                'test-secret-key',
                { expiresIn: '7d' }
            );
            expect(result).toBe(expectedToken);
        });

        it('deve usar tempo de expiração diferente do access token', () => {
            process.env.JWT_REFRESH_EXPIRE_IN = '30d';
            
            TokenUtil.generateRefreshToken('test-id');

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'test-id' },
                'test-secret-key',
                { expiresIn: '30d' }
            );
        });

        it('deve gerar tokens diferentes para chamadas sucessivas', () => {
            const token1 = 'refresh-token-1';
            const token2 = 'refresh-token-2';
            
            jwt.sign.mockReturnValueOnce(token1).mockReturnValueOnce(token2);

            const result1 = TokenUtil.generateRefreshToken('same-id');
            const result2 = TokenUtil.generateRefreshToken('same-id');

            expect(result1).toBe(token1);
            expect(result2).toBe(token2);
        });

        it('deve aceitar números como ID', () => {
            const numericId = 12345;
            
            TokenUtil.generateRefreshToken(numericId);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: numericId },
                'test-secret-key',
                { expiresIn: '7d' }
            );
        });

        it('deve propagar erro do jwt.sign', () => {
            const error = new Error('Refresh JWT Error');
            jwt.sign.mockImplementation(() => {
                throw error;
            });

            expect(() => TokenUtil.generateRefreshToken('test-id')).toThrow('Refresh JWT Error');
        });
    });

    describe('Integração entre métodos', () => {
        it('deve gerar access e refresh tokens independentemente', () => {
            const accessToken = 'access-123';
            const refreshToken = 'refresh-456';
            
            jwt.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);

            const access = TokenUtil.generateAccessToken('user-id');
            const refresh = TokenUtil.generateRefreshToken('user-id');

            expect(access).toBe(accessToken);
            expect(refresh).toBe(refreshToken);
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            
            // Verificar que foram chamados com configurações diferentes
            expect(jwt.sign).toHaveBeenNthCalledWith(1, 
                { id: 'user-id' }, 'test-secret-key', { expiresIn: '15m' });
            expect(jwt.sign).toHaveBeenNthCalledWith(2, 
                { id: 'user-id' }, 'test-secret-key', { expiresIn: '7d' });
        });

        it('deve funcionar com variáveis de ambiente ausentes', () => {
            delete process.env.JWT_SECRET;
            delete process.env.JWT_EXPIRES_IN;
            delete process.env.JWT_REFRESH_EXPIRE_IN;

            jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

            TokenUtil.generateAccessToken('test');
            TokenUtil.generateRefreshToken('test');

            expect(jwt.sign).toHaveBeenNthCalledWith(1, 
                { id: 'test' }, undefined, { expiresIn: undefined });
            expect(jwt.sign).toHaveBeenNthCalledWith(2, 
                { id: 'test' }, undefined, { expiresIn: undefined });
        });
    });

    describe('Edge cases', () => {
        it('deve tratar objeto como ID', () => {
            const objId = { id: 'test' };
            jwt.sign.mockReturnValue('object-token');
            
            TokenUtil.generateAccessToken(objId);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: objId },
                'test-secret-key',
                { expiresIn: '15m' }
            );
        });

        it('deve tratar array como ID', () => {
            const arrayId = ['test', 'id'];
            jwt.sign.mockReturnValue('array-token');
            
            TokenUtil.generateRefreshToken(arrayId);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: arrayId },
                'test-secret-key',
                { expiresIn: '7d' }
            );
        });

        it('deve manter referência singleton', () => {
            const instance1 = TokenUtil;
            const instance2 = TokenUtil;
            
            expect(instance1).toBe(instance2);
            expect(instance1.generateAccessToken).toBe(instance2.generateAccessToken);
            expect(instance1.generateRefreshToken).toBe(instance2.generateRefreshToken);
        });
    });
});
