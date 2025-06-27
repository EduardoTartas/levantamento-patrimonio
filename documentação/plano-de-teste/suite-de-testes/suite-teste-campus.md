# Plano de Teste para Model (Milestone 2 - Sprint 3)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Campos obrigatórios | Um campus só pode ser cadastrado se possuir `nome` e `cidade`. | Tentar salvar campus sem `nome` ou sem `cidade` (individualmente e com strings vazias). | A operação deve falhar com erro de validação (`Path \`nome\` is required`, `Path \`cidade\` is required`). |
| Cadastro válido | Um campus com `nome` e `cidade` válidos deve ser salvo com sucesso. | Inserir campus com `nome: "Campus IFRO"` e `cidade: "Vilhena"`. | O campus é salvo e retornado com `_id`, `nome`, `cidade` e `status` como `true`. |
| Valor padrão de status | Ao cadastrar um campus sem informar o campo `status`, o valor padrão deve ser `true`. | Cadastrar campus omitindo o campo `status`. | O campo `status` do campus salvo deve ser `true`. |
| Validação de tipos | Os campos devem aceitar apenas os tipos definidos no schema (ex: `nome` como `String`). | Tentar salvar campus com `nome: 1234` e `cidade: true`. | A operação deve falhar com erro de cast (`Cast to String failed`). |
| Registro de timestamps | O sistema deve registrar automaticamente `createdAt` e `updatedAt`. | Cadastrar um campus e verificar os campos `createdAt` e `updatedAt`. | Ambos os campos existem, são instâncias de `Date` e foram preenchidos corretamente. |
| Listar todos os campus | O sistema deve retornar todos os registros de campus existentes. | Após cadastrar múltiplos campus, usar `Campus.find()` para buscar todos. | A consulta retorna um array com o número correto de registros. |
| Paginação | O sistema deve suportar paginação na listagem de campus. | Inserir 15 campus e paginar com `limit: 5, page: 2`. | O resultado contém 5 registros, `page` igual a 2, `totalDocs` = 15, `totalPages` = 3. |
| Atualização de campos | Deve ser possível atualizar campos como `nome` e `cidade`. | Buscar um campus, atualizar `nome` e `cidade` e salvar. | O campus atualizado reflete as alterações e `updatedAt` é mais recente. |
| Remoção de campus | Um campus existente pode ser removido do sistema. | Cadastrar um campus, depois usar `Campus.deleteOne()` para removê-lo. | A operação retorna `deletedCount: 1` e o campus não é mais encontrado com `findById`. |

# Plano de Teste Controller (Milestone 2 - Sprint 3)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Validação de schema | Deve validar os schemas de entrada para ID, query e corpo da requisição. | Enviar requisições com dados inválidos (ID malformado, query com tipo errado, corpo sem campos obrigatórios). | Deve retornar erro 400 ou 422 para dados inválidos. |
| Nome/Cidade já cadastrado | Não deve permitir cadastro ou atualização de campus com a mesma combinação de nome e cidade já existente. | Enviar requisição `POST` ou `PATCH` com `nome` e `cidade` já cadastrados. | Deve retornar erro 400 ou 409 para nome/cidade já cadastrado. |
| Campus não encontrado | Deve retornar erro ao buscar, atualizar ou deletar um campus inexistente. | Buscar, atualizar ou deletar campus com ID inexistente. | Deve retornar erro 404 para campus não encontrado. |
| Resposta limpa | Não deve retornar campos desnecessários nas respostas. | Cadastrar, listar, atualizar campus e inspecionar a resposta. | A resposta não contém campos como `__v`. |
| Mensagens padronizadas | Mensagens de sucesso e erro devem ser claras e padronizadas. | Realizar operações de sucesso e erro e verificar o campo `message`. | Mensagens seguem o padrão definido em `CommonResponse`. |
| Falha inesperada | Deve retornar erro 500 para falhas inesperadas no controller. | Simular um erro inesperado em qualquer operação do controller. | Deve retornar erro 500 e mensagem padronizada. |

# Plano de Teste Service (Milestone 2 - Sprint 3)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Cadastro de campus | Deve cadastrar um campus com `nome` único por `cidade`. | Cadastrar um campus com `nome` e `cidade` válidos. | Campus salvo e retornado com `_id`. |
| Proibição de nome duplicado | Deve lançar erro ao tentar cadastrar/atualizar um campus com `nome` e `cidade` já existentes. | Cadastrar/atualizar campus com `nome` e `cidade` já existentes. | Deve lançar um `CustomError` de unicidade. |
| Campus inexistente | Deve lançar erro ao tentar atualizar ou deletar um campus que não existe. | Atualizar ou deletar um campus com ID inexistente. | Deve lançar um `CustomError` com status 404. |
| Remoção com vínculo | Deve lançar erro ao tentar remover um campus vinculado a um usuário. | Tentar remover um campus que está vinculado a pelo menos um usuário. | Deve lançar um `CustomError` de recurso em uso (conflito). |
| Falha inesperada do repository | Deve propagar o erro se o `repository` lançar uma exceção em qualquer operação. | Simular um erro sendo lançado por um método do `CampusRepository`. | O método do serviço deve lançar o mesmo erro e não comprometer a integridade dos dados. |

# Plano de Teste Repository (Milestone 2 - Sprint 3)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Buscar por nome e cidade | Deve buscar um campus pela combinação de `nome` e `cidade`. | Buscar campus pelos campos `nome` e `cidade`. | Retorna o campus correto. |
| Buscar por id | Deve buscar um campus pelo `_id` corretamente. | Buscar campus pelo campo `_id`. | Retorna o campus correto. |
| Aplicar filtros de busca | Deve aplicar filtros de busca (ex: `nome`, `cidade`, `ativo`) na listagem. | Buscar campi com diferentes filtros de query. | Retorna apenas os campi que atendem aos filtros aplicados. |
| Impedir remoção com vínculo | Deve verificar se um campus está vinculado a usuários antes da remoção. | Chamar `verificarUsuariosAssociados` para um campus com e sem usuários. | Retorna um documento de usuário se houver vínculo, caso contrário, `null`. |
| Erro para operações inválidas | Deve retornar um erro apropriado para operações em um campus inexistente. | Buscar, atualizar ou deletar um campus com um ID que não existe. | Deve lançar um `CustomError` com status 404. |
| Remoção de campus inexistente | Deve lançar um erro ao tentar deletar um campus com um ID que não existe. | Tentar deletar um campus com um ID que não está no banco. | Deve lançar um `CustomError` com status 404. |

# Plano de Teste Endpoints (Milestone 2 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listar campus | Deve retornar todos os campi via `GET /campus`. | Fazer requisição `GET /campus`. | A resposta contém um array com os campi cadastrados e status 200. |
| Buscar por id | Deve retornar o campus correto via `GET /campus/:id`. | Fazer requisição `GET /campus/:id`. | Retorna o campus correto ou erro 404 se não encontrado. |
| Cadastrar campus | Deve cadastrar um campus via `POST /campus`. | Fazer `POST /campus` com dados válidos. | Campus cadastrado e retornado com `_id` e status 201. |
| Cadastro inválido | Não deve cadastrar campus com dados inválidos via `POST /campus`. | Fazer `POST /campus` sem `nome` ou com `nome` duplicado para a mesma cidade. | Retorna erro 400 (dados inválidos) ou 409 (conflito) conforme o caso. |
| Atualizar campus | Deve atualizar um campus via `PATCH /campus/:id`. | Fazer `PATCH /campus/:id` com um novo `nome`. | O nome do campus é alterado corretamente e a resposta é 200. |
| Atualização inválida | Não deve atualizar um campus com ID inexistente. | Fazer `PATCH /campus/:id` com um ID inexistente. | Retorna erro 404. |
| Remover campus | Deve remover um campus via `DELETE /campus/:id`. | Fazer `DELETE /campus/:id` para um campus sem usuários vinculados. | Campus removido com sucesso, com status 200. |
| Remoção proibida | Não deve remover um campus vinculado a usuários. | Fazer `DELETE /campus/:id` para um campus com usuários vinculados. | Retorna erro 400 de recurso em uso (conflito). |
| Filtros de busca | Deve aplicar filtros via query params em `GET /campus`. | Fazer `GET /campus?cidade=Vilhena`. | Retorna apenas os campi que atendem ao filtro. |
| Erro inesperado | Deve retornar erro 500 para falhas inesperadas nas rotas. | Simular um erro interno em qualquer rota do campus. | Retorna erro 500 e uma mensagem padronizada. |