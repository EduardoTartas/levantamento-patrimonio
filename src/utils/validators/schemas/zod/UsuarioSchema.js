import { z } from "zod";
import objectIdSchema from "./ObjectIdSchema.js";
import isValidCPF from "../../../cpfValidator.js"; 

const senhaRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const UsuarioSchema = z.object({
  campus: objectIdSchema,
  nome: z.string().min(1, "Campo nome é obrigatório."),
  cpf: z
    .string()
    .min(1, "Campo CPF é obrigatório.")
    .transform(val => val.replace(/[.-]/g, ''))
    .refine(val => /^\d{11}$/.test(val), {
      message: "CPF deve conter 11 dígitos numéricos.",
    })
    .refine(isValidCPF, {
      message: "CPF inválido (dígitos verificadores não conferem).", 
    }),
  email: z
    .string()
    .email("Formato de email inválido.")
    .min(1, "Campo email é obrigatório."),
  senha: z
    .string()
    .refine((val) => val === undefined || senhaRegex.test(val), {
      message:
        "A senha deve ter pelo menos 8 caracteres, com 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
    })
    .optional(),
  cargo: z.enum(["Comissionado", "Funcionario Cpalm"], {
    errorMap: () => {
      return {
        message: 'O cargo deve ser "Comissionado" ou "Funcionario Cpalm".',
      };
    },
  }),
  status: z.boolean().default(true),
});

const UsuarioUpdateSchema = UsuarioSchema.partial().extend({
  senha: z
    .string()
    .refine((val) => val === undefined || senhaRegex.test(val), {
        message:
          "A senha deve ter pelo menos 8 caracteres, com 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
      })
    .optional(),
    status: z.boolean().default(true),
});

export { UsuarioSchema, UsuarioUpdateSchema };
