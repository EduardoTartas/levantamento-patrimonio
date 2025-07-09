import { RotaSchema, RotaUpdateSchema } from '../../../../../../utils/validators/schemas/zod/RotaSchema.js';
import { z } from 'zod';

describe('RotaSchema', () => {
    describe('RotaSchema', () => {
        it('deve aceitar dados válidos mínimos com valores padrão', () => {
            const validData = {
                rota: '/api/teste',
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.rota).toBe('/api/teste');
            expect(result.data.dominio).toBe('usuario');
            expect(result.data.ativo).toBe(true);
            expect(result.data.buscar).toBe(false);
            expect(result.data.enviar).toBe(false);
            expect(result.data.substituir).toBe(false);
            expect(result.data.modificar).toBe(false);
            expect(result.data.excluir).toBe(false);
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

        it('deve rejeitar quando campos obrigatórios estão ausentes', () => {
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

        it('deve rejeitar quando rota é string vazia', () => {
            const invalidData = {
                rota: '',
                dominio: 'usuario'
            };

            const result = RotaSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
        });

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
        it('deve aceitar objeto vazio', () => {
            const validData = {};

            const result = RotaUpdateSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({});
        });

        it('deve aceitar campos parciais', () => {
            const validData = {
                rota: '/api/nova-rota',
                ativo: false,
                buscar: true
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

        it('deve rejeitar tipos inválidos', () => {
            const invalidData = {
                rota: 123,
                ativo: 'sim'
            };

            const result = RotaUpdateSchema.safeParse(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
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