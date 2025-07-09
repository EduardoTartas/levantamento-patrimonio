import { NovaSenhaSchema } from '../../../../../../utils/validators/schemas/zod/NovaSenhaSchema.js';
import { z } from 'zod';

describe('NovaSenhaSchema', () => {
    describe('Senhas válidas', () => {
        it('deve aceitar senhas com todos os requisitos', () => {
            const senhasValidas = [
                'MinhaSenh@123',
                'ValidPass1',
                'AbCdE123',
                'Password1$',
                'MySecure1'
            ];

            senhasValidas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
                expect(result.data).toBe(senha);
            });
        });

        it('deve aceitar caracteres especiais válidos', () => {
            const caracteresEspeciais = ['@', '$', '!', '%', '*', '?', '&'];
            
            caracteresEspeciais.forEach(char => {
                const senha = `Password1${char}`;
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar senhas longas', () => {
            const senhaLonga = 'UmaSenhaMuitoLongaComNumeros123';
            const result = NovaSenhaSchema.safeParse(senhaLonga);
            expect(result.success).toBe(true);
            expect(senhaLonga.length).toBeGreaterThan(8);
        });
    });

    describe('Senhas inválidas', () => {
        it('deve rejeitar senha sem letra maiúscula', () => {
            const senhasSemMaiuscula = [
                'password123',
                'minhasenha1',
                'teste123@'
            ];

            senhasSemMaiuscula.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });

        it('deve rejeitar senha sem letra minúscula', () => {
            const senhasSemMinuscula = [
                'PASSWORD123',
                'MINHASENHA1',
                'TESTE123@'
            ];

            senhasSemMinuscula.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });

        it('deve rejeitar senha sem número', () => {
            const senhasSemNumero = [
                'Password',
                'MinhaSenh@',
                'TesteUser'
            ];

            senhasSemNumero.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });

        it('deve rejeitar senhas com menos de 8 caracteres', () => {
            const senhasCurtas = [
                'Ab1',
                'Test12',
                'Pass1'
            ];

            senhasCurtas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(senha.length).toBeLessThan(8);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });

        it('deve rejeitar senhas com caracteres especiais inválidos', () => {
            const caracteresInvalidos = ['#', '^', '(', ')', '-', '+', '=', '[', ']'];
            
            caracteresInvalidos.forEach(char => {
                const senha = `Password1${char}`;
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });

        it('deve rejeitar senha com espaços', () => {
            const senhasComEspaco = [
                'Password 123',
                ' Password123',
                'Password123 '
            ];

            senhasComEspaco.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
            });
        });

        it('deve rejeitar valores não string', () => {
            const valoresInvalidos = [
                123,
                null,
                undefined,
                {},
                [],
                true,
                false
            ];

            valoresInvalidos.forEach(valor => {
                const result = NovaSenhaSchema.safeParse(valor);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].code).toBe('invalid_type');
            });
        });

        it('deve rejeitar string vazia', () => {
            const result = NovaSenhaSchema.safeParse('');
            
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe(
                'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
            );
        });
    });

    describe('Estrutura do schema', () => {
        it('deve ser uma instância de ZodString', () => {
            expect(NovaSenhaSchema).toBeInstanceOf(z.ZodEffects);
            expect(NovaSenhaSchema._def.schema).toBeInstanceOf(z.ZodString);
        });

        it('deve ter refinement configurado', () => {
            expect(NovaSenhaSchema._def.effect.type).toBe('refinement');
        });

        it('deve retornar a mensagem de erro correta', () => {
            const result = NovaSenhaSchema.safeParse('invalid');
            
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe(
                'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
            );
        });
    });
});
