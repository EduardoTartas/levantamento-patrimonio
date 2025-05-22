

# Plano de Teste para Model (Srint 2) 


| Funcionalidade            | Comportamento Esperado                                                          | Verificações                                                  | Critérios de Aceite                                                          |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Cadastro de usuário       | Um usuário só pode ser cadastrado se possuir nome, CPF, email e cargo           | Tentar salvar usuário sem `nome`, `cpf`, `email` ou `cargo`  | A operação deve falhar com erro de validação (`required`)                    |
| Cadastro válido           | Um usuário com todos os campos válidos deve ser salvo com sucesso               | Inserir um usuário com todos os campos preenchidos corretamente | O usuário é salvo e retornado com `_id`, `createdAt` e `updatedAt`             
| CPF único                 | O sistema deve garantir que o CPF do usuário seja único                         | Tentar cadastrar dois usuários com o mesmo `cpf`             | A operação deve falhar com erro de validação de unicidade                    |
| Email único               | O sistema deve garantir que o email do usuário seja único                       | Tentar cadastrar dois usuários com o mesmo `email`           | A operação deve falhar com erro de validação de unicidade                    |
| Valor padrão de status    | Ao cadastrar um usuário sem informar `status`, o valor padrão deve ser `true`  | Cadastrar um usuário sem o campo `status`                    | O campo `status` deve estar como `true` no documento salvo                   |
| Registro de timestamps    | O sistema deve registrar automaticamente as datas de criação e atualização      | Cadastrar um usuário e verificar `createdAt` e `updatedAt`    | Os campos `createdAt` e `updatedAt` existem e são preenchidos corretamente   |
| Leitura de usuários       | O sistema deve retornar todos os usuários cadastrados                           | Fazer find() para verificar leitura dos dados inseridos       | A resposta contém um array com os usuários cadastrados                       |
| Atualização de usuário    | Deve ser possível atualizar informações de um usuário válido                    | Fazer updateOne() / findByIdAndUpdate()                       | O usuário deve refletir os dados alterados e o `updatedAt` deve ser atualizado |
| Remoção de usuário        | Um usuário existente pode ser removido do sistema                               | Fazer deleteOne() / findByIdAndDelete()                       | O usuário é removido e não aparece mais na listagem                          |



# Plano de Teste Controller (Sprint X)

# Plano de Teste Server (Sprint X)

# Plano de Teste Repository (Sprint X)

# Plano de Teste ENDPOINT (Sprint X)
