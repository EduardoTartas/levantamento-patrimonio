import { z } from "zod";

const NovaSenhaSchema = z.string().refine((senha) => {
  const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return senhaRegex.test(senha);
}, {
  message: "A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres."
});

export { NovaSenhaSchema };