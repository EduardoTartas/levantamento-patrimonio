import { PermissaoSchema, PermissoesArraySchema } from '../../../../../../utils/validators/schemas/zod/PermissaoValidation.js';
import { z } from 'zod';

describe('PermissaoValidation', () => {
    describe('PermissaoSchema', () => {
        it('deve aceitar dados válidos mínimos', () => {
            const validData = {
                rota: '/api/teste'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar dados válidos completos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario',
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: true,
                modificar: false,
                excluir: true
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve rejeitar quando rota está ausente', () => {
            const invalidData = {
                dominio: 'usuario'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['rota'],
                        message: 'Required'
                    })
                ])
            );
        });

        it('deve rejeitar quando rota é string vazia', () => {
            const invalidData = {
                rota: '',
                dominio: 'usuario'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['rota'],
                        message: 'O campo rota é obrigatório.'
                    })
                ])
            );
        });

        it('deve rejeitar quando campos têm tipos inválidos', () => {
            const invalidData = {
                rota: 123,
                dominio: 456,
                ativo: 'sim'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
        });

        it('deve aceitar rota com caracteres especiais', () => {
            const validData = {
                rota: '/api/test!@#$%^&*()_+-=[]{}|;:,.<>?'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
        });

        it('deve ignorar campos não definidos no schema', () => {
            const dataWithExtra = {
                rota: '/api/teste',
                dominio: 'usuario',
                campoExtra: 'valor',
                outroExtra: 123
            };

            const result = PermissaoSchema.safeParse(dataWithExtra);
            
            expect(result.success).toBe(true);
            expect(result.data.campoExtra).toBeUndefined();
            expect(result.data.outroExtra).toBeUndefined();
        });
    });

    describe('PermissoesArraySchema', () => {
        it('deve aceitar array vazio', () => {
            const validData = [];

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('deve aceitar array com múltiplas permissões únicas', () => {
            const validData = [
                {
                    rota: '/api/teste1',
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste2',
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste1',
                    dominio: 'admin'
                }
            ];

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar permissões com dominio undefined como únicas', () => {
            const validData = [
                {
                    rota: '/api/teste1'
                },
                {
                    rota: '/api/teste2'
                },
                {
                    rota: '/api/teste1',
                    dominio: 'usuario'
                }
            ];

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve rejeitar array com permissões duplicadas', () => {
            const invalidData = [
                {
                    rota: '/api/teste',
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste',
                    dominio: 'usuario'
                }
            ];

            const result = PermissoesArraySchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['permissoes'],
                        message: 'Permissões duplicadas: rota + domínio devem ser únicos dentro do array.'
                    })
                ])
            );
        });

        it('deve rejeitar array com elementos inválidos', () => {
            const invalidData = [
                {
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste',
                    dominio: 'admin'
                }
            ];

            const result = PermissoesArraySchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });

        it('deve rejeitar valores que não são arrays', () => {
            const invalidData = {
                rota: '/api/teste'
            };

            const result = PermissoesArraySchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });
    });
});