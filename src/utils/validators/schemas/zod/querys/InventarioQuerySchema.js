import { z } from "zod";
import mongoose from 'mongoose';

export const InventarioIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "ID inválido",
});

export const InventarioQuerySchema = z.object({
    nome: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: "Nome não pode ser vazio",
        })
        .transform((val) => val?.trim()),
    ativo: z
        .string()
        .optional()
        .refine((val) => !val || val === "true" || val === "false", {
            message: "Ativo deve ser 'true' ou 'false'",
        }),
    data: z
        .string()
        .optional()
        .refine((val) => !val || val.trim().length > 0, {
            message: "Data não pode ser vazia",
        }),
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => Number.isInteger(val) && val > 0, {
            message: "Page deve ser um número inteiro maior que 0",
        }),
    limite: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
            message: "Limite deve ser um número inteiro entre 1 e 100",
        }),
});
