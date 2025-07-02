# Plano de Teste para Model (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Campos obrigatórios | Um bem só pode ser cadastrado se possuir `sala`, `nome`, `responsavel.nome` e `valor`. | Tentar salvar bem sem `sala`, `nome`, `responsavel.nome` ou `valor` (individualmente e com strings vazias). | A operação deve falhar com erro de validação (`Path \`sala\` is required`, `Path \`nome\` is required`, `Path \`responsavel.nome\` is required`, `Path \`valor\` is required`). |
| Cadastro válido | Um bem com campos obrigatórios válidos deve ser salvo com sucesso, `auditado` padrão `false`, e timestamps. | Inserir bem com todos os campos obrigatórios válidos (com e sem campos opcionais). | Bem salvo e retornado com `_id`, `createdAt`, `updatedAt`. Campo `auditado` é `false` por padrão. Campos opcionais (`tombo`, `descrição`, `responsavel.cpf`) podem ser `undefined`. |
| Validação de formato de sala | O campo `sala` deve ser um ObjectId válido. | Tentar salvar bem com `sala` que não é um ObjectId válido. | A operação deve falhar com erro de cast para ObjectId (`Cast to ObjectId failed`). |
| Validação de tipos | Os campos devem aceitar apenas os tipos definidos no schema (`nome` como String, `valor` como Number, `auditado` como Boolean). | Tentar salvar bem com `nome: 1234`, `valor: "abc"`, `auditado: "maybe"`. | A operação deve falhar com erro de cast (`Cast to String failed`, `Cast to Number failed`, `Cast to Boolean failed`). |
| Unicidade de tombo | O sistema deve garantir que `tombo` seja único quando fornecido (índice sparse). | Tentar cadastrar bens com mesmo `tombo` não vazio. | A segunda operação deve falhar com erro de chave duplicada (`E11000 duplicate key error`) para o campo `tombo`. |
| Múltiplos bens sem tombo | Deve permitir múltiplos bens sem tombo (campo opcional com índice sparse). | Cadastrar múltiplos bens omitindo o campo `tombo`. | Todos os bens são salvos com sucesso sem conflito de chave única. |
| Índices de busca | O sistema deve criar índices nos campos `nome` e `responsavel.cpf` para otimização. | Verificar existência dos índices após inicialização do modelo. | Os índices existem e são utilizados nas consultas de busca. |
| Paginação | O sistema deve suportar paginação na listagem de bens usando mongoose-paginate-v2. | Inserir 15 bens e paginar com `limit: 5, page: 2`. | O resultado contém 5 registros, `page` igual a 2, `totalDocs` = 15, `totalPages` = 3. |
| Busca por campos | Deve ser possível buscar bens por `nome`, `tombo`, `auditado` usando os índices. | Buscar bens usando diferentes campos como filtro. | As consultas retornam apenas os bens que atendem aos critérios de busca. |
| Timestamps automáticos | O sistema deve registrar automaticamente `createdAt` e `updatedAt`. | Cadastrar e depois atualizar um bem. | Ambos os campos existem, são instâncias de `Date`. `updatedAt` é atualizado após modificações. |

# Plano de Teste Controller (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listagem de bens (Geral) | Deve listar todos os bens (sem ID/query), filtrar por query, ou buscar por ID. | Chamar `listar()` sem parâmetros, com query válida, e com ID válido. | Serviço chamado. `CommonResponse.success` com dados apropriados (lista total, filtrada ou individual). |
| Validação de entrada (ID) | Deve validar ID usando `BemIdSchema` (Zod) antes de processar requisição. | Chamar `listar()` com ID inválido (não ObjectId). | Controller lança erro de validação Zod. Serviço não é chamado. |
| Validação de entrada (Query) | Deve validar parâmetros de query usando `BemQuerySchema` (Zod) quando fornecidos. | Chamar `listar()` com query inválida (`page: 0`, `limite: 150`, `auditado: "maybe"`). | Controller lança erro de validação Zod. Serviço não é chamado. |
| Validação condicional | Deve validar ID apenas se fornecido e query apenas se não estiver vazia. | Chamar `listar()` com ID ausente e query vazia. | Nenhuma validação é executada. Serviço é chamado diretamente. |
| Filtros válidos | Deve processar corretamente filtros válidos de busca. | Chamar `listar()` com query válida (`nome`, `tombo`, `responsavel`, `auditado`, `sala`, `page`, `limite`). | Validação passa. Serviço é chamado com requisição. `CommonResponse.success` é retornado. |
| Busca por ID | Deve buscar bem específico quando ID válido é fornecido. | Chamar `listar()` com `req.params.id` válido. | ID é validado. Serviço é chamado. Bem individual é retornado via `CommonResponse.success`. |
| Tratamento de strings vazias | Deve rejeitar filtros com strings vazias ou apenas espaços. | Chamar `listar()` com `nome`, `tombo` ou `sala` contendo apenas espaços. | Validação falha com erro específico ("Nome não pode ser vazio", etc.). |
| Validação de paginação | Deve validar parâmetros de paginação (`page` > 0, `limite` 1-100). | Chamar `listar()` com `page: 0`, `page: -1`, `limite: 0`, `limite: 150`. | Validação falha com erros específicos para cada caso inválido. |
| Propagação de erro do serviço | Deve propagar erros originados no `BemService` (repository, banco de dados). | Mockar método do serviço para lançar erro. | Controller lança o mesmo erro vindo do serviço. |
| Valores padrão | Deve aplicar valores padrão quando parâmetros opcionais não são fornecidos. | Chamar `listar()` sem `page`, `limite` na query. | Validação aplica valores padrão (`page: 1`, `limite: 10`). Serviço recebe requisição com valores padrão. |

# Plano de Teste Service (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listar bens (Serviço) | Deve chamar `repository.listar` com os parâmetros da requisição e retornar os dados. | Chamar `service.listar(mockReq)` com diferentes tipos de requisição. | `repository.listar` é chamado com `mockReq`. O resultado do repositório é retornado sem modificação. |
| Listar com filtros | Deve processar requisições com filtros de busca e paginação. | Chamar `service.listar()` com `req.query` contendo filtros (`nome`, `tombo`, `responsavel`, `auditado`, `sala`, `page`, `limite`). | Repository é chamado com a requisição completa. Dados paginados são retornados corretamente. |
| Listar por ID | Deve buscar bem específico quando ID é fornecido em `req.params.id`. | Chamar `service.listar()` com `req.params.id` válido. | Repository é chamado para busca por ID. Bem individual é retornado com dados populados da sala. |
| Lista vazia | Deve retornar lista vazia quando não há bens que atendem aos critérios. | Chamar `service.listar()` quando repository retorna array vazio. | Array vazio é retornado sem erro. |
| Propagação de erro do repository | Deve propagar erros originados no `BemRepository` (banco de dados, validação, etc.). | Mockar método do repository para lançar erro. | O método do service rejeita com o mesmo erro lançado pelo repository. |
| Validação de existência (`ensureBemExists`) | Deve buscar bem por ID e lançar erro se não encontrado. | Chamar `service.ensureBemExists(id)` com ID existente e inexistente. | `repository.buscarPorId` é chamado. Retorna bem se encontrado ou lança `CustomError` se não encontrado. |
| Integração entre métodos | Deve ser possível usar `ensureBemExists` após `listar` para verificações adicionais. | Chamar `listar` seguido de `ensureBemExists` com mesmo ID. | Ambos métodos funcionam corretamente em sequência. Dados consistentes entre chamadas. |

# Plano de Teste Repository (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Construtor com validação | Deve instanciar corretamente e validar se o modelo possui método `paginate`. | Instanciar repository com modelo válido e inválido. | Repository instanciado com sucesso. Deve lançar erro se modelo não tiver `paginate`. |
| Buscar por ID (`buscarPorId`) | Deve buscar bem por ID. Lança `CustomError` (NOT_FOUND) se não encontrado. | Chamar `repository.buscarPorId()` com ID existente e inexistente. | `BemModel.findById` é chamado. Retorna dados do bem ou lança `CustomError` (404, "resourceNotFound", "Bem"). |
| Listar com ID específico | Se ID fornecido: busca por ID com `populate` de sala. Lança erro se não encontrado. | Chamar `repository.listar()` com `req.params.id` existente e inexistente. | `findById().populate({ path: 'sala', select: 'nome _id' })` é chamado. Retorna bem com dados da sala ou lança `CustomError` (404). |
| Listar com paginação | Se sem ID: usa `BemFilterBuilder`, `paginate` com opções, `populate`, `sort`. Lida com filtros e paginação. | Chamar `repository.listar()` com várias queries (`nome`, `tombo`, `responsavel`, `auditado`, `sala`, `page`, `limite`). | `FilterBuilder` é criado e configurado. `model.paginate()` é chamado com filtros e opções de paginação corretas. |
| Aplicação de filtros | Deve aplicar corretamente filtros de busca usando `BemFilterBuilder`. | Testar diferentes combinações de filtros (`nome`, `tombo`, `responsavel`, `auditado`, `sala`). | Cada método do FilterBuilder é chamado com os valores corretos. Filtros são construídos adequadamente. |
| Validação de limite | Deve aplicar limite máximo de 100 registros por página. | Chamar `listar()` com `limite: 150`. | O limite é automaticamente reduzido para 100 na chamada do `paginate`. |
| Valores padrão | Deve usar valores padrão para `page: 1`, `limite: 10`, `auditado: false`. | Chamar `listar()` sem parâmetros de paginação ou com valores inválidos. | Valores padrão são aplicados corretamente nas opções do `paginate`. |
| Tratamento de erro do FilterBuilder | Deve lançar `CustomError` (INTERNAL_SERVER_ERROR) se `filterBuilder.build` não for função. | Simular FilterBuilder sem método `build`. | Lança `CustomError` (500, "internalServerError", "Bem") quando `build` não é função. |
| Propagação de erros | Deve propagar erros do banco de dados e do método `paginate`. | Simular erros no `findById` e `paginate`. | Erros são propagados sem modificação para a camada superior. |
| Tratamento de edge cases | Deve lidar com `req.query` undefined, `req.params` null e campos null/undefined. | Testar cenários com requisições malformadas. | Repository funciona corretamente mesmo com parâmetros ausentes ou inválidos. |

# Plano de Teste Endpoints (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Listar bens | Deve retornar todos os bens via `GET /bens`. | Fazer requisição `GET /bens`. | A resposta contém um array com os bens cadastrados e status 200. |
| Buscar por ID | Deve retornar o bem correto via `GET /bens/:id`. | Fazer requisição `GET /bens/:id` com ID válido e inválido. | Retorna o bem correto com dados da sala populados ou erro 404 se não encontrado. |
| Filtros de busca | Deve aplicar filtros via query params em `GET /bens`. | Fazer `GET /bens?nome=Mesa&auditado=true&page=1&limite=5`. | Retorna apenas os bens que atendem aos filtros aplicados com paginação. |
| Paginação | Deve retornar dados paginados com metadados via `GET /bens`. | Fazer `GET /bens?page=2&limite=5` com múltiplos bens cadastrados. | Resposta contém `docs`, `totalDocs`, `page`, `totalPages`, `hasNextPage`, `hasPrevPage`. |
| Filtro por nome | Deve buscar bens por nome (case-insensitive, regex) via query param. | Fazer `GET /bens?nome=mesa` (minúsculo) para bem com nome "Mesa de Escritório". | Retorna bens que contenham "mesa" no nome, independente de case. |
| Filtro por tombo | Deve buscar bens por tombo exato via query param. | Fazer `GET /bens?tombo=TOM123` para bem com tombo exato. | Retorna apenas bens com tombo exatamente igual a "TOM123". |
| Filtro por responsável | Deve buscar bens por nome do responsável via query param. | Fazer `GET /bens?responsavel=João` para bens do responsável "João da Silva". | Retorna bens cujo responsável contenha "João" no nome. |
| Filtro por auditado | Deve filtrar bens por status de auditoria via query param. | Fazer `GET /bens?auditado=true` e `GET /bens?auditado=false`. | Retorna apenas bens com status de auditoria correspondente ao filtro. |
| Filtro por sala | Deve buscar bens por ID da sala via query param. | Fazer `GET /bens?sala=507f1f77bcf86cd799439013` com ObjectId válido. | Retorna bens da sala especificada com dados da sala populados. |
| Validação de parâmetros | Deve retornar erro 400 para parâmetros inválidos. | Fazer `GET /bens/:id` com ID inválido, `GET /bens?page=0`, `GET /bens?limite=150`. | Retorna erro 400 com mensagem específica para cada tipo de validação. |
| Límite de paginação | Deve aplicar limite máximo de 100 registros por página. | Fazer `GET /bens?limite=200`. | Resposta limitada a 100 registros no máximo. |
| Populate de sala | Deve retornar dados da sala junto com cada bem. | Fazer `GET /bens` e `GET /bens/:id`. | Cada bem contém objeto `sala` com `_id` e `nome` da sala. |
| Erro inesperado | Deve retornar erro 500 para falhas inesperadas nas rotas. | Simular erro interno em qualquer rota do bem. | Retorna erro 500 e mensagem padronizada. |
| Query string vazia | Deve processar requisições sem query params usando valores padrão. | Fazer `GET /bens` sem parâmetros. | Retorna primeira página com 10 registros (valores padrão). |
| Múltiplos filtros | Deve aplicar múltiplos filtros simultaneamente. | Fazer `GET /bens?nome=Mesa&auditado=true&responsavel=João`. | Retorna apenas bens que atendem a TODOS os filtros aplicados. |
