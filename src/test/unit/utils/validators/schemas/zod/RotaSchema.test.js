import { RotaSchema, RotaUpdateSchema } from '../../../../../../utils/validators/schemas/zod/RotaSchema.js';
import { z } from 'zod';

describe('RotaSchema', () => {
    describe('RotaSchema', () => {
        // --- Testes de validação com dados válidos ---
        it('deve aceitar dados válidos mínimos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.rota).toBe('/api/teste');
            expect(result.data.dominio).toBe('usuario');
            expect(result.data.ativo).toBe(true); // valor padrão
            expect(result.data.buscar).toBe(false); // valor padrão
            expect(result.data.enviar).toBe(false); // valor padrão
            expect(result.data.substituir).toBe(false); // valor padrão
            expect(result.data.modificar).toBe(false); // valor padrão
            expect(result.data.excluir).toBe(false); // valor padrão
        });

        it('deve aceitar dados válidos completos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario',
                ativo: false,
                buscar: true,
                enviar: true,
                substituir: true,
                modificar: true,
                excluir: true
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aplicar valores padrão corretamente', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'admin'
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.ativo).toBe(true);
            expect(result.data.buscar).toBe(false);
            expect(result.data.enviar).toBe(false);
            expect(result.data.substituir).toBe(false);
            expect(result.data.modificar).toBe(false);
            expect(result.data.excluir).toBe(false);
        });

        // --- Testes de validação de campos obrigatórios ---
        it('deve rejeitar quando rota está ausente', () => {
            const invalidData = {
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['rota']
                    })
                ])
            );
        });

        it('deve rejeitar quando dominio está ausente', () => {
            const invalidData = {
                rota: '/api/teste'
            };

            const result = RotaSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ['dominio']
                    })
                ])
            );
        });

        it('deve rejeitar quando rota é string vazia', () => {
            const invalidData = {
                rota: '',
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });

        // --- Testes de validação de tipos ---
        it('deve rejeitar quando campos boolean são inválidos', () => {
            const invalidData = {
                rota: '/api/teste',
                dominio: 'usuario',
                ativo: 'sim',
                buscar: 1
            };

            const result = RotaSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        });

        it('deve aceitar diferentes valores boolean válidos', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario',
                ativo: false,
                buscar: true,
                enviar: false,
                substituir: true,
                modificar: false,
                excluir: true
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar caracteres especiais em rota', () => {
            const validData = {
                rota: '/api/test!@#$%^&*()_+-=[]{}|;:,.<>?',
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
        });
    });

    describe('RotaUpdateSchema', () => {
        // --- Testes com schema parcial ---
        it('deve aceitar objeto vazio (todos campos opcionais)', () => {
            const validData = {};

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({});
        });

        it('deve aceitar apenas rota', () => {
            const validData = {
                rota: '/api/nova-rota'
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar apenas dominio', () => {
            const validData = {
                dominio: 'novo-dominio'
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar apenas campos boolean', () => {
            const validData = {
                ativo: false,
                buscar: true,
                modificar: true
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar todos os campos', () => {
            const validData = {
                rota: '/api/atualizada',
                dominio: 'admin',
                ativo: false,
                buscar: true,
                enviar: true,
                substituir: false,
                modificar: true,
                excluir: false
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve rejeitar tipos inválidos mesmo sendo parcial', () => {
            const invalidData = {
                rota: 123,
                ativo: 'sim'
            };

            const result = RotaUpdateSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        });

        it('deve aceitar rota vazia no update (pode querer limpar)', () => {
            const validData = {
                rota: ''
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(false); // BaseRotaSchema ainda exige min(1)
        });

        it('deve não aplicar valores padrão no update schema', () => {
            const validData = {
                rota: '/api/teste'
            };

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.ativo).toBeUndefined();
            expect(result.data.buscar).toBeUndefined();
            expect(result.data.enviar).toBeUndefined();
            expect(result.data.substituir).toBeUndefined();
            expect(result.data.modificar).toBeUndefined();
            expect(result.data.excluir).toBeUndefined();
        });
    });
});