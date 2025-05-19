import { z } from 'zod';
import objectIdSchema from "./ObjectIdSchema.js";

const InventarioSchema = z.object({
    campus: objectIdSchema,
    nome: z.string().min(1, "Campo nome é obrigatório."),
    data: z.coerce.date({
        errorMap: () => ({ message: "Data deve estar no formato dd/mm/aaaa" })
        }).refine(
        (date) => {
            return !isNaN(date.getTime());
        },
        {
            message: "Por favor, insira a data no formato dd/mm/aaaa"
        }
    ),
    status: z.boolean().default(true)
});

export {InventarioSchema};