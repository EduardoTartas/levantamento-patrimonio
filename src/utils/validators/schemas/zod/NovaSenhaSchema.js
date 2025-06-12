import { z } from "zod";

/** Definição da expressão regular para a senha
* Padrão: 1 letra maiúscula, 1 letra minúscula, 1 número
* Tamanho mínimo: 8 caracteres
**/

const NovaSenhaSchema = z.string().refine((senha) => {
  const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return senhaRegex.test(senha);
}, {
  message: "A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres."
});

export { NovaSenhaSchema };