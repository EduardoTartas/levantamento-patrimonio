import { z } from 'zod';

const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const LoginSchema = z.object({
    email: z.string().email('Formato de email inválido.').min(1, 'Campo email é obrigatório.'),
    senha: z
        .string()
});

export { LoginSchema };
