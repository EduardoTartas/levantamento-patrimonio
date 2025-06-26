import { z } from "zod";
import objectIdSchema from "./ObjectIdSchema.js"; 

const fotoUploadValidationSchema = z.object({
  fieldname: z.string().optional(),
  originalname: z.string()
      .optional()
      .refine((val) => !val || /\.(jpg|jpeg|png)$/i.test(val), {
          message: 'O arquivo deve ter extensão .jpg, .jpeg ou .png'
      }),
  encoding: z.string().optional(),
  mimetype: z.union([
      z.literal('image/jpeg'),
      z.literal('image/jpg'),
      z.literal('image/png')
  ], {
      message: 'O arquivo enviado não é uma imagem válida. Por favor, envie um arquivo com tipo válido como JPEG ou PNG.'
  }),
  buffer: z.instanceof(Buffer, {
      message: 'O buffer do arquivo é inválido.'
  })
  .refine((buffer) => buffer.length > 0, {
      message: 'O arquivo de imagem não pode estar vazio.'
  }),
  size: z.number()
      .gt(0, "O tamanho do arquivo deve ser maior que zero.")
      .lte(5 * 1024 * 1024, "O arquivo não pode ser maior que 5MB.")
}).passthrough();

const LevantamentoSchema = z.object({  inventario: objectIdSchema,
  bemId: objectIdSchema,
  salaNova: objectIdSchema.optional(),
  imagem: z.array(
    z.string().url("A URL da imagem é inválida.")
  )
  .default([])
  .optional(),
  estado: z.enum(
    ["Em condições de uso", "Inservível", "Danificado"], 
    {
      errorMap: () => ({ 
        message: 'O estado deve ser "Em condições de uso", "Inservível" ou "Danificado".' 
      }),
    }
  ),
  ocioso: z.boolean()
    .default(false)
    .optional(),
});

const LevantamentoUpdateSchema = LevantamentoSchema.omit({ bemId: true, inventario: true }).partial();

export { LevantamentoSchema, LevantamentoUpdateSchema, fotoUploadValidationSchema };