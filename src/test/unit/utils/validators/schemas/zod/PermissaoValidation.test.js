import { PermissaoSchema, PermissoesArraySchema } from '../../../../../../utils/validators/schemas/zod/PermissaoValidation.js';
import { z } from 'zod';

describe('PermissaoValidation', () => {
    describe('PermissaoSchema', () => {
        // --- Testes de validação com dados válidos ---
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

        it('deve aceitar dados válidos com campos opcionais omitidos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'admin'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar dados válidos com apenas alguns campos boolean', () => {
            const validData = {
                rota: '/api/teste',
                buscar: true,
                modificar: false
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        // --- Testes de validação do campo rota (obrigatório) ---
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

        it('deve rejeitar quando rota não é string', () => {
            const invalidData = {
                rota: 123,
                dominio: 'usuario'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['rota']
                    })
                ])
            );
        });

        it('deve rejeitar quando rota é null', () => {
            const invalidData = {
                rota: null,
                dominio: 'usuario'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['rota']
                    })
                ])
            );
        });

        // --- Testes de validação do campo dominio (opcional) ---
        it('deve aceitar dominio válido', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.dominio).toBe('usuario');
        });

        it('deve aceitar quando dominio está ausente', () => {
            const validData = {
                rota: '/api/teste'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.dominio).toBeUndefined();
        });

        it('deve rejeitar quando dominio não é string', () => {
            const invalidData = {
                rota: '/api/teste',
                dominio: 123
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['dominio']
                    })
                ])
            );
        });

        // --- Testes de validação dos campos boolean ---
        it('deve aceitar campos boolean válidos', () => {
            const validData = {
                rota: '/api/teste',
                ativo: true,
                buscar: false,
                enviar: true,
                substituir: false,
                modificar: true,
                excluir: false
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve rejeitar quando ativo não é boolean', () => {
            const invalidData = {
                rota: '/api/teste',
                ativo: 'sim'
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['ativo']
                    })
                ])
            );
        });

        it('deve rejeitar quando buscar não é boolean', () => {
            const invalidData = {
                rota: '/api/teste',
                buscar: 1
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['buscar']
                    })
                ])
            );
        });

        it('deve rejeitar múltiplos campos boolean inválidos', () => {
            const invalidData = {
                rota: '/api/teste',
                enviar: 'true',
                substituir: 0,
                modificar: 'false',
                excluir: null
            };

            const result = PermissaoSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
        });

        // --- Testes com dados extremos ---
        it('deve aceitar rota com caracteres especiais', () => {
            const validData = {
                rota: '/api/test!@#$%^&*()_+-=[]{}|;:,.<>?'
            };

            const result = PermissaoSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
        });

        it('deve aceitar dominio com acentos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuário-ção'
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
        // --- Testes com arrays válidos ---
        it('deve aceitar array vazio', () => {
            const validData = [];

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('deve aceitar array com uma permissão válida', () => {
            const validData = [
                {
                    rota: '/api/teste',
                    dominio: 'usuario'
                }
            ];

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
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

        // --- Testes com arrays inválidos ---
        it('deve rejeitar array com permissões duplicadas (mesma rota e dominio)', () => {
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

        it('deve rejeitar array com permissões duplicadas (sem dominio)', () => {
            const invalidData = [
                {
                    rota: '/api/teste'
                },
                {
                    rota: '/api/teste'
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

        it('deve rejeitar array com múltiplas duplicatas', () => {
            const invalidData = [
                {
                    rota: '/api/teste1',
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste1',
                    dominio: 'usuario'
                },
                {
                    rota: '/api/teste2',
                    dominio: 'admin'
                },
                {
                    rota: '/api/teste2',
                    dominio: 'admin'
                }
            ];

            const result = PermissoesArraySchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });

        it('deve rejeitar array que não é array', () => {
            const invalidData = {
                rota: '/api/teste'
            };

            const result = PermissoesArraySchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });

        it('deve rejeitar array com elementos inválidos', () => {
            const invalidData = [
                {
                    // rota ausente
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

        // --- Testes de casos extremos ---
        it('deve aceitar array com muitas permissões únicas', () => {
            const validData = Array.from({ length: 50 }, (_, i) => ({
                rota: `/api/teste${i}`,
                dominio: `dominio${i % 5}`
            }));

            const result = PermissoesArraySchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(50);
        });

        it('deve tratar null como valor inválido', () => {
            const result = PermissoesArraySchema.safeParse(null);
            
            expect(result.success).toBe(false);
        });

        it('deve tratar undefined como valor inválido', () => {
            const result = PermissoesArraySchema.safeParse(undefined);
            
            expect(result.success).toBe(false);
        });
    });
});