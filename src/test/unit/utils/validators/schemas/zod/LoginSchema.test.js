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
                'a@b.co'
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
                'user@.com'
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

        it('deve rejeitar email como tipos inválidos', () => {
            const invalidTypes = [null, undefined, 123];

            invalidTypes.forEach(email => {
                const result = LoginSchema.safeParse({
                    email,
                    senha: 'ValidPass123'
                });

                expect(result.success).toBe(false);
                expect(result.error.issues[0].code).toBe('invalid_type');
            });
        });
    });

    describe('Validação de senha', () => {
        it('deve aceitar qualquer string como senha', () => {
            const passwords = [
                'MinhaSenh@123',
                'ValidPass1',
                'senha123',
                'PASSWORD',
                'password',
                'short',
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

        it('deve rejeitar senha como tipos inválidos', () => {
            const invalidTypes = [null, undefined, 12345678];

            invalidTypes.forEach(senha => {
                const result = LoginSchema.safeParse({
                    email: 'test@test.com',
                    senha
                });

                expect(result.success).toBe(false);
                expect(result.error.issues[0].code).toBe('invalid_type');
            });
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

        it('deve rejeitar dados como tipos inválidos', () => {
            const invalidTypes = [null, 'invalid data', 123];

            invalidTypes.forEach(data => {
                const result = LoginSchema.safeParse(data);
                expect(result.success).toBe(false);
                expect(result.error.issues[0].code).toBe('invalid_type');
            });
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
