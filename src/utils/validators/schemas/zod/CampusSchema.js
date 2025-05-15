import { z } from "zod";
// Optionally, consider removing or mocking the repository import during tests.
// import UnidadeRepository from '../../../../repositories/UnidadeRepository.js';

const CampusSchema = z
  .object({
    nome: z
        .string({required_error: "O campo nome é obrigatório.",})
        .min(1, "Este campo é obrigatório"),
    telefone: z
      .string()
      .optional()
      .refine((val) => !val || /^(\d{10,11}|\(\d{2}\)\s?\d{4,5}-?\d{4})$/.test(val),
      {message:"Telefone inválido. Use formato (XX) XXXXX-XXXX ou apenas números"}),
    cidade: z
      .string({required_error: "O campo cidade é obrigatório.",})
      .min(1, "Este campo é obrigatório"),
    bairro: z.string().optional(),
    rua: z.string().optional(),
    numeroResidencia: z.string().optional(),
    status: z.boolean().default(true),
  })
  .passthrough();

const CampusUpdateSchema = CampusSchema.partial().extend({
  status: z.boolean().default(true),
});

export { CampusSchema, CampusUpdateSchema };
