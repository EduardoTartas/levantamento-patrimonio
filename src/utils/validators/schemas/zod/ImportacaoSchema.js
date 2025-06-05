import { z } from 'zod';

/**
 * Schema para validar arquivos CSV enviados para importação
 * Verifica tipo MIME, tamanho e existência de conteúdo válido
 */
const fileUploadValidationSchema = z.object({
    fieldname: z.string().optional(),
    originalname: z.string()
        .optional()
        .refine((val) => !val || val.endsWith('.csv'), {
            message: 'O arquivo deve ter a extensão .csv'
        }),
    encoding: z.string().optional(),
    mimetype: z.union([
        z.literal('text/csv'),
        z.literal('application/csv'),
        z.literal('application/vnd.ms-excel')
    ], {
        message: 'O arquivo enviado não é um CSV válido. Por favor, envie um arquivo com tipo válido como text/csv.'
    }),
    buffer: z.instanceof(Buffer, {
        message: 'O buffer do arquivo é inválido.'
    })
    .refine((buffer) => buffer.length > 0, {
        message: 'O arquivo CSV não pode estar vazio.'
    }),
    size: z.number()
        .gt(0, "O tamanho do arquivo deve ser maior que zero.")
        .lte(10 * 1024 * 1024, "O arquivo não pode ser maior que 10MB.")
}).passthrough();

export {fileUploadValidationSchema};
