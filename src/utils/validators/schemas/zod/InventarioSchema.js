import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

const InventarioSchema = z.object({
    campus: objectIdSchema,
    nome: z.string().min(1, 'Campo nome é obrigatório.'),
    data: z.string()
        .superRefine((val, ctx) => {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data deve estar no formato dd/mm/aaaa" });
                return z.NEVER;
            }
            const [diaStr, mesStr, anoStr] = val.split('/');
            const dia = parseInt(diaStr, 10);
            const mes = parseInt(mesStr, 10);
            const ano = parseInt(anoStr, 10);

            if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Por favor, insira uma data válida no formato dd/mm/aaaa (dia ou mês fora do intervalo básico)"
                });
                return z.NEVER;
            }

            const date = new Date(ano, mes - 1, dia);

            if (
                date.getFullYear() !== ano ||
                date.getMonth() !== mes - 1 ||
                date.getDate() !== dia ||
                isNaN(date.getTime())
            ) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Por favor, insira uma data válida no formato dd/mm/aaaa" });
                return z.NEVER;
            }
        })
        .transform((val) => {
            const [dia, mes, ano] = val.split('/');
            return new Date(Date.UTC(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10)));
        }),
    status: z.boolean().default(true)
});

const InventarioUpdateSchema = InventarioSchema.partial().extend({
    status: z.boolean().optional().default(true)
});

export { InventarioSchema, InventarioUpdateSchema };
