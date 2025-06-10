import { z } from "zod";
import mongoose from 'mongoose';

export const LevatamentoIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "ID inválido",
});


export const LevantamentoQuerySchema = z.object({
  tombo: z
    .string()
    .optional()
    .refine((val) => val === undefined || val.trim().length > 0, {
        message: "O tombo não pode ser vazio.",
    })
    .transform((val) => val?.trim()),

  sala: z
    .string()
    .optional()
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
        message: "O ID da sala é inválido.",
    }),

  inventario: z
    .string()
    .optional()
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
        message: "O ID do inventário é inválido.",
    }),
  
  estado: z
    .enum(["Em condições de uso", "Inservível", "Danificado"])
    .optional(),

  ocioso: z
    .string()
    .optional()
    .refine((value) => value === undefined || value === "true" || value === "false", {
        message: "O valor para 'ocioso' deve ser 'true' ou 'false'.",
    }),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => Number.isInteger(val) && val > 0, {
        message: "O parâmetro 'page' deve ser um número inteiro maior que 0.",
    }),

  limite: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
        message: "O parâmetro 'limite' deve ser um número inteiro entre 1 e 100.",
    }),
});