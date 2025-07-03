## Plano de Teste Controller (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Validação de arquivo upload | Deve validar se um arquivo foi enviado na requisição. | Enviar requisição POST sem arquivo anexado. | Deve retornar erro 400 com mensagem "Nenhum arquivo CSV enviado". |
| Validação de campus ID | Deve validar o `campusId` usando CampusIdSchema quando fornecido. | Enviar requisição com `campusId` inválido nos parâmetros. | Deve retornar erro de validação de ObjectId. |
| Validação de arquivo CSV | Deve validar o arquivo usando fileUploadValidationSchema. | Enviar arquivo com tipo/tamanho inválido. | Deve retornar erro de validação do arquivo. |
| Chamada do serviço | Deve chamar ImportacaoService.importCSV com arquivo e metadados corretos. | Verificar se o serviço é chamado com `req.file` e objeto de metadados. | Serviço é chamado com arquivo e `{nome, campus_id}`. |
| Resposta de sucesso | Deve retornar resumo da importação com estatísticas. | Fazer upload de arquivo CSV válido. | Retorna objeto com `totalRecordsProcessed`, `totalRecordsInserted`, `totalRecordsSkipped`, `errorsCount`. |
| Tratamento de erros | Deve incluir amostras de erros quando há falhas na importação. | Fazer upload de arquivo com dados inválidos. | Resposta inclui `errorSamples` com até 10 exemplos de erros. |
| Mensagem de conclusão | Deve retornar mensagem informativa sobre o resultado da importação. | Verificar campo `message` na resposta. | Mensagem inclui nome do arquivo e status da conclusão. |

## Plano de Teste Service (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Processamento de CSV | Deve processar arquivo CSV e extrair dados linha por linha. | Enviar arquivo CSV com múltiplas linhas de dados. | Cada linha é processada e dados são extraídos corretamente. |
| Validação de dados CSV | Deve validar cada linha do CSV usando ImportacaoSchema. | Processar CSV com linhas válidas e inválidas. | Linhas inválidas são rejeitadas e incluídas no relatório de erros. |
| Verificação de tombos duplicados | Deve verificar se tombos já existem antes de inserir. | Processar CSV com tombos já existentes no banco. | Tombos duplicados são identificados e não são inseridos novamente. |
| Criação de salas | Deve criar salas automaticamente quando não existem. | Processar CSV com salas não cadastradas. | Novas salas são criadas com base nos dados do CSV. |
| Busca de salas existentes | Deve buscar salas existentes por combinação de dados. | Processar CSV com salas já cadastradas. | Salas existentes são encontradas e reutilizadas. |
| Inserção em lote | Deve inserir bens válidos em lote para otimização. | Processar CSV com muitos bens válidos. | Bens são inseridos em lote usando `insertManyBens`. |
| Contagem de estatísticas | Deve contar registros processados, inseridos e ignorados. | Processar CSV misto (válidos/inválidos/duplicados). | Estatísticas refletem corretamente o resultado do processamento. |
| Tratamento de erros de linha | Deve capturar e reportar erros específicos de cada linha. | Processar CSV com erros variados (validação, duplicação, etc.). | Cada erro é capturado com informações da linha e motivo. |
| Associação com campus | Deve associar bens ao campus quando `campus_id` é fornecido. | Processar CSV com `campus_id` válido nos metadados. | Bens criados são associados ao campus correto. |

## Plano de Teste Repository (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Verificação de tombos duplicados | Deve verificar se uma lista de tombos já existe no banco. | Chamar `verificarTombosDuplicados` com array de tombos. | Retorna apenas os tombos que já existem no banco. |
| Busca de sala por combinação | Deve buscar sala por `nome`, `andar`, `bloco` e `campus`. | Chamar `findSala` com dados específicos de uma sala. | Retorna a sala correta quando existe, null quando não existe. |
| Busca de salas em lote | Deve buscar múltiplas salas por combinações diferentes. | Chamar `findSalasByCombinations` com array de combinações. | Retorna array de salas encontradas para cada combinação. |
| Criação de sala | Deve criar nova sala com dados fornecidos. | Chamar `createSala` com objeto de dados da sala. | Nova sala é criada e retornada com `_id` gerado. |
| Inserção de bens em lote | Deve inserir múltiplos bens de uma vez. | Chamar `insertManyBens` com array de objetos de bens. | Todos os bens válidos são inseridos e retornados. |
| Tratamento de erros de inserção | Deve tratar erros durante inserção em lote. | Tentar inserir bens com dados inválidos ou conflitos. | Erros são capturados e reportados apropriadamente. |
| Validação de dados de sala | Deve validar dados antes de criar sala. | Tentar criar sala com dados incompletos ou inválidos. | Dados inválidos são rejeitados com erro apropriado. |
| Otimização de consultas | Deve otimizar consultas para grandes volumes de dados. | Processar grandes listas de tombos e salas. | Consultas são executadas eficientemente sem timeouts. |

## Plano de Teste Endpoints (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Upload de CSV | Deve aceitar upload de arquivo CSV via `POST /importacao`. | Fazer `POST /importacao` com arquivo CSV válido. | Retorna status 200 e resumo da importação. |
| Upload com campus | Deve aceitar upload associado a um campus via `POST /importacao/:campusId`. | Fazer `POST /importacao/655f5e39884c8b76c56a5084` com CSV. | Bens são associados ao campus especificado. |
| Validação de arquivo ausente | Deve retornar erro quando nenhum arquivo é enviado. | Fazer `POST /importacao` sem arquivo anexado. | Retorna erro 400 com mensagem de arquivo obrigatório. |
| Validação de tipo de arquivo | Deve retornar erro para tipos de arquivo não suportados. | Fazer upload de arquivo PDF, TXT ou outro formato. | Retorna erro 400 com mensagem de tipo inválido. |
| Validação de campus ID | Deve retornar erro para campus ID inválido. | Fazer `POST /importacao/id-invalido` com CSV. | Retorna erro 400 com mensagem de ID inválido. |
| Campus inexistente | Deve retornar erro quando campus não existe. | Fazer `POST /importacao/655f5e39884c8b76c56a5099` com CSV. | Retorna erro 404 com mensagem de campus não encontrado. |
| Processamento de dados válidos | Deve processar e inserir dados válidos do CSV. | Fazer upload de CSV com dados corretos. | Dados são inseridos e estatísticas corretas são retornadas. |
| Tratamento de dados inválidos | Deve reportar erros para linhas inválidas do CSV. | Fazer upload de CSV com linhas mal formatadas. | Linhas inválidas são ignoradas e relatadas em `errorSamples`. |
| Detecção de duplicados | Deve detectar e ignorar tombos já existentes. | Fazer upload de CSV com tombos já cadastrados. | Tombos duplicados são contados em `totalRecordsSkipped`. |
| Criação automática de salas | Deve criar salas automaticamente quando necessário. | Fazer upload de CSV com salas não cadastradas. | Novas salas são criadas automaticamente. |
| Associação de bens e salas | Deve associar bens às salas corretas. | Verificar se bens são associados às salas especificadas no CSV. | Relacionamento bem-sala é estabelecido corretamente. |
| Resposta com estatísticas | Deve retornar estatísticas completas da importação. | Verificar resposta após upload bem-sucedido. | Resposta inclui contadores de processados, inseridos, ignorados e erros. |
| Limite de amostras de erro | Deve limitar amostras de erro a 10 exemplos. | Fazer upload de CSV com muitos erros. | `errorSamples` contém no máximo 10 exemplos de erros. |
| Headers de multipart | Deve aceitar requisições multipart/form-data. | Fazer upload usando form-data com campo de arquivo. | Requisição é processada corretamente com multer. |
| Tamanho máximo de arquivo | Deve respeitar limite de tamanho de arquivo. | Fazer upload de arquivo CSV muito grande. | Retorna erro quando arquivo excede limite permitido. |