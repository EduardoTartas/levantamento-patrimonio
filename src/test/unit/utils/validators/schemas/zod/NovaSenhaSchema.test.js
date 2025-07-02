import { NovaSenhaSchema } from '../../../../../../utils/validators/schemas/zod/NovaSenhaSchema.js';
import { z } from 'zod';

describe('NovaSenhaSchema', () => {
    describe('Senhas válidas', () => {
        it('deve aceitar senha com todos os requisitos', () => {
            const senhasValidas = [
                'MinhaSenh@123',
                'ValidPass1',
                'Teste123@',
                'AbC123def',
                'Password1$',
                'Str0ngP@ss',
                'MySecure1',
                'Admin123!',
                'User2024@',
                'System1&'
            ];

            senhasValidas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
                expect(result.data).toBe(senha);
            });
        });

        it('deve aceitar senha no limite mínimo de 8 caracteres', () => {
            const senhasLimite = [
                'AbCdE123', // exatamente 8 caracteres
                'Test123A',
                'Pass1234',
                'MyApp1Zz'
            ];

            senhasLimite.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
                expect(senha.length).toBe(8);
            });
        });

        it('deve aceitar senhas longas', () => {
            const senhasLongas = [
                'UmaSenhaMuitoLongaComNumeros123',
                'SuperSecurePasswordWith123Numbers',
                'A'.repeat(50) + 'b1', // 52 caracteres
                'MinhaPasswordSuperSecura123ComMuitosCaracteres'
            ];

            senhasLongas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
                expect(senha.length).toBeGreaterThan(8);
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

        it('deve aceitar múltiplos números', () => {
            const senhasComNumeros = [
                'Password123',
                'Test2024User',
                'Admin987654',
                'MyApp2023Ver2'
            ];

            senhasComNumeros.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar múltiplas letras maiúsculas e minúsculas', () => {
            const senhas = [
                'AbCdEfGh123',
                'MyTestPassword1',
                'SuperAdminUser1',
                'DatabaseUser123'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Senhas inválidas - Ausência de letra maiúscula', () => {
        it('deve rejeitar senha sem letra maiúscula', () => {
            const senhasSemMaiuscula = [
                'password123',
                'minhasenha1',
                'teste123@',
                'user2024!',
                'sistema1&'
            ];

            senhasSemMaiuscula.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });
    });

    describe('Senhas inválidas - Ausência de letra minúscula', () => {
        it('deve rejeitar senha sem letra minúscula', () => {
            const senhasSemMinuscula = [
                'PASSWORD123',
                'MINHASENHA1',
                'TESTE123@',
                'USER2024!',
                'SISTEMA1&'
            ];

            senhasSemMinuscula.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });
    });

    describe('Senhas inválidas - Ausência de número', () => {
        it('deve rejeitar senha sem número', () => {
            const senhasSemNumero = [
                'Password',
                'MinhaSenh@',
                'TesteUser',
                'AdminPass!',
                'SystemUser&'
            ];

            senhasSemNumero.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });
    });

    describe('Senhas inválidas - Tamanho insuficiente', () => {
        it('deve rejeitar senhas com menos de 8 caracteres', () => {
            const senhasCurtas = [
                'Ab1',      // 3 caracteres
                'Test12',   // 6 caracteres
                'aB3',      // 3 caracteres
                'Pass1',    // 6 caracteres
                'Abc123',   // 6 caracteres
                'My1',      // 3 caracteres
                'Us1@'      // 4 caracteres
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
    });

    describe('Senhas inválidas - Caracteres especiais não permitidos', () => {
        it('deve rejeitar senhas com caracteres especiais inválidos', () => {
            const caracteresInvalidos = ['#', '^', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/', '~', '`'];
            
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
                'Password123 ',
                'Pass word123',
                'My Password1'
            ];

            senhasComEspaco.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('Tipos de dados inválidos', () => {
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

    describe('Combinações de falhas múltiplas', () => {
        it('deve rejeitar senha que falha em múltiplos critérios', () => {
            const senhasMultiplasFalhas = [
                'abc',          // sem maiúscula, sem número, muito curta
                'ABC',          // sem minúscula, sem número, muito curta
                '123',          // sem maiúscula, sem minúscula, muito curta
                'password',     // sem maiúscula, sem número
                'PASSWORD',     // sem minúscula, sem número
                'Password',     // sem número, muito curta
                'password123',  // sem maiúscula
                'PASSWORD123'   // sem minúscula
            ];

            senhasMultiplasFalhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe(
                    'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.'
                );
            });
        });
    });

    describe('Edge cases', () => {
        it('deve aceitar senha com múltiplos caracteres especiais válidos', () => {
            const senhas = [
                'Password1@$',
                'Test123!%*',
                'User2024@!&',
                'Admin1$%?&'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar senha com números no início', () => {
            const senhas = [
                '1Password',
                '123TestAbc',
                '2024UserAbc',
                '999AdminXyz'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar senha com letras maiúsculas no final', () => {
            const senhas = [
                'password1A',
                'test123ABC',
                'user2024XYZ',
                'admin999ZZZ'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar senha alternando maiúsculas e minúsculas', () => {
            const senhas = [
                'AbCdEf123',
                'TeStPaSs1',
                'MyUsEr123',
                'AdMiN2024'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
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

    describe('Performance e casos extremos', () => {
        it('deve validar senha extremamente longa', () => {
            const senhaLonga = 'A' + 'b'.repeat(1000) + '1';
            const result = NovaSenhaSchema.safeParse(senhaLonga);
            
            expect(result.success).toBe(true);
            expect(senhaLonga.length).toBeGreaterThan(1000);
        });

        it('deve validar múltiplas senhas em sequência', () => {
            const senhas = Array.from({ length: 100 }, (_, i) => `Password${i}A`);
            
            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });

        it('deve funcionar com caracteres Unicode básicos', () => {
            // Testando apenas caracteres ASCII válidos pelo regex
            const senhas = [
                'Password1@',
                'Test123$',
                'User2024!',
                'Admin999%'
            ];

            senhas.forEach(senha => {
                const result = NovaSenhaSchema.safeParse(senha);
                expect(result.success).toBe(true);
            });
        });
    });
});
