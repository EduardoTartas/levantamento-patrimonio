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
    });
});
