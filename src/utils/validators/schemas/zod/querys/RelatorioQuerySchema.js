import { z } from "zod";
import mongoose from 'mongoose';

export const RelatorioQuerySchema = z.object({
    inventarioId: z
        .string({ required_error: "inventarioId é obrigatório" })
        .min(1, { message: "inventarioId é obrigatório" })
        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
            message: "inventarioId deve ser um ObjectId válido",
        }),
    
    tipoRelatorio: z
        .string({ required_error: "tipoRelatorio é obrigatório" })
        .min(1, { message: "tipoRelatorio é obrigatório" })
        .refine((tipo) => [
            'geral',
            'bens_danificados', 
            'bens_inserviveis',
            'bens_ociosos',
            'bens_nao_encontrados',
            'bens_sem_etiqueta'
        ].includes(tipo), {
            message: "Tipo de relatório inválido. Valores aceitos: geral, bens_danificados, bens_inserviveis, bens_ociosos, bens_nao_encontrados, bens_sem_etiqueta",
        }),
    
    sala: z
        .string()
        .optional()
        .refine((id) => !id || mongoose.Types.ObjectId.isValid(id), {
            message: "sala deve ser um ObjectId válido",
        })
}).strict();
