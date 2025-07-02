# Plano de Teste para Model (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Campos obrigatórios | Uma sala só pode ser cadastrada se possuir `campus`, `nome` e `bloco`. | Tentar salvar sala sem `campus`, `nome` ou `bloco` (individualmente e com strings vazias). | A operação deve falhar com erro de validação (`Path \`campus\` is required`, `Path \`nome\` is required`, `Path \`bloco\` is required`). |
| Cadastro válido | Uma sala com campos obrigatórios válidos deve ser salva com sucesso e timestamps. | Inserir sala com todos os campos obrigatórios válidos. | Sala salva e retornada com `_id`, `createdAt`, `updatedAt`. Referência ao campus mantida corretamente. |
| Validação de formato de campus | O campo `campus` deve ser um ObjectId válido. | Tentar salvar sala com `campus` que não é um ObjectId válido. | A operação deve falhar com erro de cast para ObjectId (`Cast to ObjectId failed`). |
| Validação de tipos | Os campos devem aceitar apenas os tipos definidos no schema (`campus` como ObjectId, `nome` e `bloco` como String). | Tentar salvar sala com tipos incorretos nos campos. | A operação deve falhar com erro de cast apropriado para cada tipo inválido. |
| Índices de busca | O sistema deve criar índice no campo `nome` para otimização de consultas. | Verificar existência do índice após inicialização do modelo. | O índice existe e é utilizado nas consultas de busca por nome. |
| Paginação | O sistema deve suportar paginação na listagem de salas usando mongoose-paginate-v2. | Inserir 25 salas e paginar com `limit: 10, page: 3`. | O resultado contém 5 registros, `page` igual a 3, `totalDocs` = 25, `totalPages` = 3. |
| Busca por campos | Deve ser possível buscar salas por `nome`, `campus`, `bloco` usando os índices. | Buscar salas usando diferentes campos como filtro. | As consultas retornam apenas as salas que atendem aos critérios de busca. |
| Timestamps automáticos | O sistema deve registrar automaticamente `createdAt` e `updatedAt`. | Cadastrar e depois atualizar uma sala. | Ambos os campos existem, são instâncias de `Date`. `updatedAt` é atualizado após modificações. |
| CRUD Operations | Deve realizar operações básicas de criação, leitura, atualização e exclusão. | Executar create, findById, findByIdAndUpdate e findByIdAndDelete. | Todas as operações funcionam corretamente e retornam dados esperados. |
| Múltiplas salas | Deve permitir múltiplas salas do mesmo campus e diferentes campus. | Inserir várias salas com mesmo campus e campus diferentes. | Salas são criadas independentemente e filtros por campus funcionam corretamente. |

# Plano de Teste Controller (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listagem de salas (Geral) | Deve listar todas as salas (sem ID/query), filtrar por query, ou buscar por ID. | Chamar `listar()` sem parâmetros, com query válida, e com ID válido. | Serviço chamado. `CommonResponse.success` com dados apropriados (lista total, filtrada ou individual). |
| Validação de entrada (ID) | Deve validar ID usando `SalaIdSchema` (Zod) antes de processar requisição. | Chamar `listar()` com ID inválido (não ObjectId). | Controller lança erro de validação Zod. Serviço não é chamado. |
| Validação de entrada (Query) | Deve validar parâmetros de query usando `SalaQuerySchema` (Zod) quando fornecidos. | Chamar `listar()` com query inválida (`page: 0`, `limite: 150`). | Controller lança erro de validação Zod. Serviço não é chamado. |
| Validação condicional | Deve validar ID apenas se fornecido e query apenas se não estiver vazia. | Chamar `listar()` com ID ausente e query vazia. | Nenhuma validação é executada. Serviço é chamado diretamente. |
| Filtros válidos | Deve processar corretamente filtros válidos de busca. | Chamar `listar()` com query válida (`nome`, `campus`, `bloco`, `page`, `limite`). | Validação passa. Serviço é chamado com requisição. `CommonResponse.success` é retornado. |
| Busca por ID | Deve buscar sala específica quando ID válido é fornecido. | Chamar `listar()` com `req.params.id` válido. | ID é validado. Serviço é chamado. Sala individual é retornada via `CommonResponse.success`. |
| Tratamento de strings vazias | Deve rejeitar filtros com strings vazias ou apenas espaços. | Chamar `listar()` com `nome`, `campus` ou `bloco` contendo apenas espaços. | Validação falha com erro específico ("Nome não pode ser vazio", etc.). |
| Validação de paginação | Deve validar parâmetros de paginação (`page` > 0, `limite` 1-100). | Chamar `listar()` com `page: 0`, `page: -1`, `limite: 0`, `limite: 150`. | Validação falha com erros específicos para cada caso inválido. |
| Propagação de erro do serviço | Deve propagar erros originados no `SalaService` (repository, banco de dados). | Mockar método do serviço para lançar erro. | Controller lança o mesmo erro vindo do serviço. |
| Valores padrão | Deve aplicar valores padrão quando parâmetros opcionais não são fornecidos. | Chamar `listar()` sem `page`, `limite` na query. | Validação aplica valores padrão (`page: 1`, `limite: 10`). Serviço recebe requisição com valores padrão. |

# Plano de Teste Service (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listar salas (Serviço) | Deve chamar `repository.listar` com os parâmetros da requisição e retornar os dados. | Chamar `service.listar(mockReq)` com diferentes tipos de requisição. | `repository.listar` é chamado com `mockReq`. O resultado do repositório é retornado sem modificação. |
| Listar com filtros | Deve processar requisições com filtros de busca e paginação. | Chamar `service.listar()` com `req.query` contendo filtros (`nome`, `campus`, `bloco`, `page`, `limite`). | Repository é chamado com a requisição completa. Dados paginados são retornados corretamente. |
| Listar por ID | Deve buscar sala específica quando ID é fornecido em `req.params.id`. | Chamar `service.listar()` com `req.params.id` válido. | Repository é chamado para busca por ID. Sala individual é retornada com dados populados do campus. |
| Lista vazia | Deve retornar lista vazia quando não há salas que atendem aos critérios. | Chamar `service.listar()` quando repository retorna array vazio. | Array vazio é retornado sem erro. |
| Propagação de erro do repository | Deve propagar erros originados no `SalaRepository` (banco de dados, validação, etc.). | Mockar método do repository para lançar erro. | O método do service rejeita com o mesmo erro lançado pelo repository. |
| Validação de existência (`ensureSalaExists`) | Deve buscar sala por ID e lançar erro se não encontrado. | Chamar `service.ensureSalaExists(id)` com ID existente e inexistente. | `repository.buscarPorId` é chamado. Retorna sala se encontrado ou lança `CustomError` se não encontrado. |
| Integração entre métodos | Deve ser possível usar `ensureSalaExists` após `listar` para verificações adicionais. | Chamar `listar` seguido de `ensureSalaExists` com mesmo ID. | Ambos métodos funcionam corretamente em sequência. Dados consistentes entre chamadas. |
| Tratamento de parâmetros especiais | Deve lidar corretamente com req vazio, undefined ou malformado. | Testar com diferentes tipos de entrada no service. | Service funciona robustamente sem falhar com entradas não convencionais. |

# Plano de Teste Repository (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Construtor com validação | Deve instanciar corretamente e validar se o modelo possui método `paginate`. | Instanciar repository com modelo válido e inválido. | Repository instanciado com sucesso. Deve lançar erro se modelo não tiver `paginate`. |
| Buscar por ID (`buscarPorId`) | Deve buscar sala por ID. Lança `CustomError` (NOT_FOUND) se não encontrado. | Chamar `repository.buscarPorId()` com ID existente e inexistente. | `SalaModel.findById` é chamado. Retorna dados da sala ou lança `CustomError` (404, "resourceNotFound", "Sala"). |
| Listar com ID específico | Se ID fornecido: busca por ID com `populate` de campus. Lança erro se não encontrado. | Chamar `repository.listar()` com `req.params.id` existente e inexistente. | `findById().populate({ path: 'campus', select: 'nome _id' })` é chamado. Retorna sala com dados do campus ou lança `CustomError` (404). |
| Listar com paginação | Se sem ID: usa `SalaFilterBuilder`, `paginate` com opções, `populate`, `sort`. Lida com filtros e paginação. | Chamar `repository.listar()` com várias queries (`nome`, `campus`, `bloco`, `page`, `limite`). | `FilterBuilder` é criado e configurado. `model.paginate()` é chamado com filtros e opções de paginação corretas. |
| Aplicação de filtros | Deve aplicar corretamente filtros de busca usando `SalaFilterBuilder`. | Testar diferentes combinações de filtros (`nome`, `campus`, `bloco`). | Cada método do FilterBuilder é chamado com os valores corretos. Filtros são construídos adequadamente. |
| Validação de limite | Deve aplicar limite máximo de 100 registros por página. | Chamar `listar()` com `limite: 150`. | O limite é automaticamente reduzido para 100 na chamada do `paginate`. |
| Valores padrão | Deve usar valores padrão para `page: 1`, `limite: 10`. | Chamar `listar()` sem parâmetros de paginação ou com valores inválidos. | Valores padrão são aplicados corretamente nas opções do `paginate`. |
| Tratamento de erro do FilterBuilder | Deve lançar `CustomError` (INTERNAL_SERVER_ERROR) se `filterBuilder.build` não for função. | Simular FilterBuilder sem método `build`. | Lança `CustomError` (500, "internalServerError", "Sala") quando `build` não é função. |
| Propagação de erros | Deve propagar erros do banco de dados e do método `paginate`. | Simular erros no `findById` e `paginate`. | Erros são propagados sem modificação para a camada superior. |
| Tratamento de edge cases | Deve lidar com `req.query` undefined, `req.params` null e campos null/undefined. | Testar cenários com requisições malformadas. | Repository funciona corretamente mesmo com parâmetros ausentes ou inválidos. |
| Ordenação padrão | Deve aplicar ordenação por nome de forma ascendente. | Verificar options passadas para o `paginate`. | Sort é aplicado como `{ nome: 1 }` por padrão. |
| Populate de campus | Deve popular dados do campus com apenas `nome` e `_id`. | Verificar configuração do populate nas chamadas. | Populate é configurado corretamente como `{ path: 'campus', select: 'nome _id' }`. |

# Plano de Teste Endpoints (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listar salas | Deve retornar todas as salas via `GET /salas`. | Fazer requisição `GET /salas`. | A resposta contém um array com as salas cadastradas e status 200. |
| Buscar por ID | Deve retornar a sala correta via `GET /salas/:id`. | Fazer requisição `GET /salas/:id` com ID válido e inválido. | Retorna a sala correta com dados do campus populados ou erro 404 se não encontrada. |
| Filtros de busca | Deve aplicar filtros via query params em `GET /salas`. | Fazer `GET /salas?nome=Lab&campus=507f1f77bcf86cd799439011&page=1&limite=5`. | Retorna apenas as salas que atendem aos filtros aplicados com paginação. |
| Paginação | Deve retornar dados paginados com metadados via `GET /salas`. | Fazer `GET /salas?page=2&limite=5` com múltiplas salas cadastradas. | Resposta contém `docs`, `totalDocs`, `page`, `totalPages`, `hasNextPage`, `hasPrevPage`. |
| Filtro por nome | Deve buscar salas por nome (case-insensitive, regex) via query param. | Fazer `GET /salas?nome=lab` (minúsculo) para sala com nome "Laboratório". | Retorna salas que contenham "lab" no nome, independente de case. |
| Filtro por campus | Deve buscar salas por ID do campus via query param. | Fazer `GET /salas?campus=507f1f77bcf86cd799439011` com ObjectId válido. | Retorna salas do campus especificado com dados do campus populados. |
| Filtro por bloco | Deve buscar salas por bloco via query param. | Fazer `GET /salas?bloco=Bloco A` para salas do bloco específico. | Retorna salas cujo bloco contenha "Bloco A" no nome. |
| Validação de parâmetros | Deve retornar erro 400 para parâmetros inválidos. | Fazer `GET /salas/:id` com ID inválido, `GET /salas?page=0`, `GET /salas?limite=150`. | Retorna erro 400 com mensagem específica para cada tipo de validação. |
| Límite de paginação | Deve aplicar limite máximo de 100 registros por página. | Fazer `GET /salas?limite=200`. | Resposta limitada a 100 registros no máximo. |
| Populate de campus | Deve retornar dados do campus junto com cada sala. | Fazer `GET /salas` e `GET /salas/:id`. | Cada sala contém objeto `campus` com `_id` e `nome` do campus. |
| Erro inesperado | Deve retornar erro 500 para falhas inesperadas nas rotas. | Simular erro interno em qualquer rota da sala. | Retorna erro 500 e mensagem padronizada. |
| Query string vazia | Deve processar requisições sem query params usando valores padrão. | Fazer `GET /salas` sem parâmetros. | Retorna primeira página com 10 registros (valores padrão). |
| Múltiplos filtros | Deve aplicar múltiplos filtros simultaneamente. | Fazer `GET /salas?nome=Lab&campus=507f1f77bcf86cd799439011&bloco=A`. | Retorna apenas salas que atendem a TODOS os filtros aplicados. |
| Ordenação | Deve retornar salas ordenadas por nome de forma ascendente. | Fazer `GET /salas` com múltiplas salas. | Salas são retornadas ordenadas alfabeticamente por nome. |
| ID inválido formato | Deve retornar erro apropriado para IDs que não são ObjectId válidos. | Fazer `GET /salas/123` com ID muito curto. | Retorna erro 400 com mensagem "ID inválido". |
