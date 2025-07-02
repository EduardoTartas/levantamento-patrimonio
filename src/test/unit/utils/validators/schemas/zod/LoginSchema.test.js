import { LoginSchema } from '../../../../../../utils/validators/schemas/zod/LoginSchema.js';
import { z } from 'zod';

describe('LoginSchema', () => {
    describe('Validação de email', () => {
        it('deve aceitar email válido', () => {
            const validData = {
                email: 'usuario@teste.com',
                senha: 'MinhaSenh@123'
            };

            const result = LoginSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
        });

        it('deve aceitar diferentes formatos de email válidos', () => {
            const emails = [
                'teste@gmail.com',
                'user.name@domain.co.uk',
                'user+tag@example.org',
                'user123@test-domain.com',
                'a@b.co',
                'usuario@sub.domain.com.br'
            ];

            emails.forEach(email => {
                const result = LoginSchema.safeParse({
                    email,
                    senha: 'ValidPass123'
                });
                
                expect(result.success).toBe(true);
            });
        });

        it('deve rejeitar email inválido', () => {
            const invalidEmails = [
                'email-sem-arroba.com',
                '@domain.com',
                'user@',
                'user..double.dot@domain.com',
                'user @domain.com',
                'user@domain',
                'user@.com',
                '.user@domain.com',
                'user@domain..com'
            ];

            invalidEmails.forEach(email => {
                const result = LoginSchema.safeParse({
                    email,
                    senha: 'ValidPass123'
                });
                
                expect(result.success).toBe(false);
                expect(result.error.issues[0].message).toBe('Formato de email inválido.');
            });
        });

        it('deve rejeitar email vazio', () => {
            const result = LoginSchema.safeParse({
                email: '',
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('Formato de email inválido.');
        });

        it('deve rejeitar email como undefined', () => {
            const result = LoginSchema.safeParse({
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues.some(issue => 
                issue.path.includes('email') && issue.code === 'invalid_type'
            )).toBe(true);
        });

        it('deve rejeitar email como null', () => {
            const result = LoginSchema.safeParse({
                email: null,
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });

        it('deve rejeitar email como número', () => {
            const result = LoginSchema.safeParse({
                email: 123,
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });
    });

    describe('Validação de senha', () => {
        it('deve aceitar senha válida', () => {
            const validPasswords = [
                'MinhaSenh@123',
                'ValidPass1',
                'Teste123@',
                'AbC123def',
                'Password1$',
                'Str0ngP@ss',
                'senha123', // senha simples também é aceita
                'PASSWORD', // só maiúsculas
                'password', // só minúsculas
                'short'     // senha curta
            ];

            validPasswords.forEach(senha => {
                const result = LoginSchema.safeParse({
                    email: 'test@test.com',
                    senha
                });
                
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar qualquer string como senha', () => {
            const passwords = [
                'PASSWORD123',
                'password123',
                'Password',
                'weak',
                '123',
                '@#$%',
                ' ValidPass123 '
            ];

            passwords.forEach(senha => {
                const result = LoginSchema.safeParse({
                    email: 'test@test.com',
                    senha
                });
                
                expect(result.success).toBe(true);
            });
        });

        it('deve aceitar senha vazia', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: ''
            });

            expect(result.success).toBe(true);
        });

        it('deve rejeitar senha como undefined', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues.some(issue => 
                issue.path.includes('senha') && issue.code === 'invalid_type'
            )).toBe(true);
        });

        it('deve rejeitar senha como null', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: null
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });

        it('deve rejeitar senha como número', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: 12345678
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });

        it('deve aceitar espaços em branco na senha', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: ' senha com espaços '
            });

            expect(result.success).toBe(true);
        });
    });

    describe('Validação completa do objeto', () => {
        it('deve aceitar dados válidos completos', () => {
            const validData = {
                email: 'admin@empresa.com.br',
                senha: 'AdminPass123@'
            };

            const result = LoginSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            expect(result.data.email).toBe(validData.email);
            expect(result.data.senha).toBe(validData.senha);
        });

        it('deve rejeitar objeto vazio', () => {
            const result = LoginSchema.safeParse({});

            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThan(0);
            expect(result.error.issues.some(issue => issue.path.includes('email'))).toBe(true);
            expect(result.error.issues.some(issue => issue.path.includes('senha'))).toBe(true);
        });

        it('deve rejeitar dados como null', () => {
            const result = LoginSchema.safeParse(null);

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });

        it('deve rejeitar dados como string', () => {
            const result = LoginSchema.safeParse('invalid data');

            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('invalid_type');
        });

        it('deve ignorar campos extras', () => {
            const dataWithExtra = {
                email: 'test@test.com',
                senha: 'ValidPass123',
                extraField: 'should be ignored',
                anotherField: 123
            };

            const result = LoginSchema.safeParse(dataWithExtra);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                email: 'test@test.com',
                senha: 'ValidPass123'
            });
        });

        it('deve retornar erro de email quando email é inválido', () => {
            const result = LoginSchema.safeParse({
                email: 'invalid-email',
                senha: 'any-password'
            });

            expect(result.success).toBe(false);
            expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
            
            const emailError = result.error.issues.find(issue => issue.path.includes('email'));
            
            expect(emailError).toBeDefined();
            expect(emailError.message).toBe('Formato de email inválido.');
        });
    });

    describe('Edge cases', () => {
        it('deve tratar espaços em branco no email', () => {
            const result = LoginSchema.safeParse({
                email: ' test@test.com ',
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(false);
        });

        it('deve aceitar espaços em branco na senha', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: ' ValidPass123 '
            });

            expect(result.success).toBe(true);
        });

        it('deve funcionar com senha no limite mínimo', () => {
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: 'AbCdE123' // exatamente 8 caracteres
            });

            expect(result.success).toBe(true);
        });

        it('deve funcionar com senha muito longa', () => {
            const longPassword = 'A'.repeat(50) + 'b1';
            const result = LoginSchema.safeParse({
                email: 'test@test.com',
                senha: longPassword
            });

            expect(result.success).toBe(true);
        });

        it('deve validar com email em maiúsculas', () => {
            const result = LoginSchema.safeParse({
                email: 'TEST@TEST.COM',
                senha: 'ValidPass123'
            });

            expect(result.success).toBe(true);
        });
    });

    describe('Estrutura do schema', () => {
        it('deve ser uma instância de ZodObject', () => {
            expect(LoginSchema).toBeInstanceOf(z.ZodObject);
        });

        it('deve ter as propriedades email e senha', () => {
            const shape = LoginSchema.shape;
            expect(shape.email).toBeDefined();
            expect(shape.senha).toBeDefined();
        });

        it('deve ser do tipo object', () => {
            expect(LoginSchema._def.typeName).toBe('ZodObject');
        });
    });
});
