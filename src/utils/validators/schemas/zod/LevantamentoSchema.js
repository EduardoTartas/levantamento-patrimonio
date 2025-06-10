import { z } from "zod";
import objectIdSchema from "./ObjectIdSchema.js"; 

const LevantamentoSchema = z.object({
  inventario: objectIdSchema,
  bemId: objectIdSchema,
  salaNova: objectIdSchema.optional(),
  imagem: z.string().url("A URL da imagem é inválida.").optional(),
  estado: z.enum(["Em condições de uso", "Inservível", "Danificado"], {
    errorMap: () => ({ message: 'O estado deve ser "Em condições de uso", "Inservível" ou "Danificado".' }),
  }),
  ocioso: z.boolean().default(false).optional(),
});

const LevantamentoUpdateSchema = LevantamentoSchema.partial();

export { LevantamentoSchema, LevantamentoUpdateSchema };