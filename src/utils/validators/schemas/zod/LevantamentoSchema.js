import { z } from "zod";
import objectIdSchema from "./ObjectIdSchema.js"; 

//os dados dos bens adicionais vao ser adicionados pelo service
// usuario que fez o levantamento vai ser adcionado pelo service
export const LevantamentoPayloadSchema = z.object({
  inventario: objectIdSchema,
  bemId: objectIdSchema,
  salaNova: objectIdSchema.optional(),
  imagem: z.string().url("A URL da imagem é inválida.").optional(),
  estado: z.enum(["Em condições de uso", "Inservível", "Danificado"], {
    errorMap: () => ({ message: 'O estado deve ser "Em condições de uso", "Inservível" ou "Danificado".' }),
  }),
  ocioso: z.boolean().default(false).optional(),
});