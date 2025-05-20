import { z } from 'zod';
import objectIdSchema from "./ObjectIdSchema.js";

const InventarioSchema = z.object({
    campus: objectIdSchema,
    nome: z.string().min(1, "Campo nome é obrigatório."),
    data: z.string()
        .refine(
            (val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val),
            { message: "Data deve estar no formato dd/mm/aaaa" }
        )
        .transform((val) => {
            const [dia, mes, ano] = val.split('/');
            const date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
            return date;
        })
        .refine(
            (date) => !isNaN(date.getTime()),
            { message: "Por favor, insira uma data válida no formato dd/mm/aaaa" }
        ),
    status: z.boolean().default(true)
});
const InventarioUpdateSchema = InventarioSchema.partial().extend({});

export {InventarioSchema, InventarioUpdateSchema};