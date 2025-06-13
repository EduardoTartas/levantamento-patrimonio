// src/utils/validators/schemas/zod/LoginSchema.js

import { z } from 'zod';

/** Definição da expressão regular para a senha
 * Padrão: 1 letra maiúscula, 1 letra minúscula, 1 número
 * Tamanho mínimo: 8 caracteres
 **/
const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const LoginSchema = z.object({
    email: z.string().email('Formato de email inválido.').min(1, 'Campo email é obrigatório.'),
    senha: z
        .string()
});

export { LoginSchema };
