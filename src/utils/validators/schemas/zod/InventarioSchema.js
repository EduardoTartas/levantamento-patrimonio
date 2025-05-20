import {z} from 'zod';
import objectIdSchema from "./ObjectIdSchema.js";

const InventarioSchema = z.object({
    campus: objectIdSchema,
    nome: z.string().min(1, "Campo nome é obrigatório."),
    data: z.string()
        .superRefine((val, ctx) => {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Data deve estar no formato dd/mm/aaaa"
                });
                return;
            }
            const [dia, mes, ano] = val.split('/');
            const date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
            if (isNaN(date.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Por favor, insira uma data válida no formato dd/mm/aaaa"
                });
            }
        })
        .transform((val) => {
            const [dia, mes, ano] = val.split('/');
            return new Date(`${ano}-${mes}-${dia}T00:00:00`);
        }),
    status: z.boolean().default(true)
});
const InventarioUpdateSchema = InventarioSchema.partial().extend({});

export {
    InventarioSchema,
    InventarioUpdateSchema
};