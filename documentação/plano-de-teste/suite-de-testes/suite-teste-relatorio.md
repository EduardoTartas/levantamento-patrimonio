## Plano de Teste Controller (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Validação de schema | Deve validar os dados de entrada usando RelatorioQuerySchema quando query não está vazia. | Enviar requisições com query válida e inválida. | Query válida passa na validação, query inválida é rejeitada pelo schema. |
| Pular validação para query vazia | Não deve validar quando a query está vazia. | Enviar requisição com query vazia `{}`. | Schema não é chamado e o serviço é executado normalmente. |
| Geração de PDF | Deve chamar o serviço e retornar PDF com headers corretos. | Chamar método `gerar` com dados válidos. | Retorna buffer PDF com headers "Content-Type: application/pdf" e "Content-Disposition: attachment". |
| Chamada do serviço | Deve passar a query recebida para o RelatorioService. | Verificar se `service.gerarRelatorio` é chamado com a query correta. | Serviço é chamado com os mesmos parâmetros da requisição. |
| Headers de resposta | Deve definir headers corretos para download de PDF. | Verificar headers na resposta do controller. | Headers "Content-Type" e "Content-Disposition" são definidos corretamente. |

## Plano de Teste Service (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Validação de campos obrigatórios | Deve lançar erro se `inventarioId` ou `tipoRelatorio` estão faltando. | Chamar `gerarRelatorio` sem campos obrigatórios. | Deve lançar `CustomError` com mensagem de campos obrigatórios. |
| Verificação de inventário | Deve verificar se o inventário existe antes de gerar relatório. | Chamar serviço com `inventarioId` válido e inválido. | Deve chamar `inventarioService.ensureInvExists` com o ID fornecido. |
| Verificação de sala opcional | Deve verificar se a sala existe apenas quando fornecida. | Chamar serviço com e sem campo `sala`. | `salaService.ensureSalaExists` é chamado apenas quando `sala` é fornecida. |
| Filtros de relatório | Deve aplicar filtros corretos para cada tipo de relatório. | Gerar relatórios de tipos diferentes (geral, bens_danificados, etc.). | Cada tipo aplica o filtro correto na consulta do Levantamento. |
| Tipo de relatório inválido | Deve lançar erro para tipos de relatório não suportados. | Chamar com `tipoRelatorio: "tipo_invalido"`. | Deve lançar `CustomError` de tipo inválido. |
| Filtro de sala | Deve aplicar filtro de sala quando fornecido. | Gerar relatório com campo `sala` preenchido. | Filtro `"bem.salaId"` é adicionado à consulta. |
| Geração de PDF | Deve gerar buffer PDF válido a partir dos dados. | Chamar `_gerarPDF` com dados de levantamentos. | Retorna buffer válido que representa um PDF. |
| População de dados | Deve popular campos relacionados na consulta. | Verificar consulta do Levantamento. | Campos `salaNova` e `usuario` são populados corretamente. |

## Plano de Teste Repository (Não aplicável)

*Nota: RelatorioService não possui repository próprio, utiliza diretamente o model Levantamento.*

## Plano de Teste Endpoints (Milestone 3 - Sprint 7)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| Gerar relatório geral | Deve gerar relatório geral via `GET /relatorios`. | Fazer `GET /relatorios?inventarioId=XXX&tipoRelatorio=geral`. | Retorna PDF com status 200 e headers corretos. |
| Gerar relatório com filtros | Deve gerar relatórios específicos por tipo. | Fazer requisições com `tipoRelatorio=bens_danificados`, `bens_ociosos`, etc. | Cada tipo retorna PDF correspondente com status 200. |
| Gerar relatório com sala | Deve gerar relatório filtrado por sala. | Fazer `GET /relatorios` incluindo parâmetro `sala`. | PDF é gerado com filtro de sala aplicado. |
| Validação de campos obrigatórios | Deve retornar erro quando campos obrigatórios estão faltando. | Fazer `GET /relatorios` sem `inventarioId` ou `tipoRelatorio`. | Retorna erro 400 com mensagem de campos obrigatórios. |
| Validação de ObjectId | Deve retornar erro para IDs malformados. | Fazer requisição com `inventarioId=id-invalido` ou `sala=sala-invalida`. | Retorna erro 400 com mensagem de ID inválido. |
| Tipo de relatório inválido | Deve retornar erro para tipos não suportados. | Fazer `GET /relatorios` com `tipoRelatorio=tipo_invalido`. | Retorna erro 400 com mensagem de tipo inválido. |
| Inventário não encontrado | Deve retornar erro quando inventário não existe. | Fazer requisição com `inventarioId` inexistente. | Retorna erro 404 com mensagem de inventário não encontrado. |
| Sala não encontrada | Deve retornar erro quando sala não existe. | Fazer requisição com `sala` inexistente. | Retorna erro 404 com mensagem de sala não encontrada. |
| Headers de download | Deve retornar headers corretos para download de PDF. | Verificar headers na resposta de qualquer relatório gerado. | Headers incluem "Content-Type: application/pdf" e "Content-Disposition: attachment". |
| Tipos de relatório suportados | Deve suportar todos os tipos predefinidos. | Fazer requisições para cada tipo: geral, bens_danificados, bens_inserviveis, bens_ociosos, bens_nao_encontrados, bens_sem_etiqueta. | Todos os tipos retornam PDF válido com status 200. |
| Resposta em buffer | Deve retornar conteúdo como buffer PDF válido. | Verificar se response.body é um buffer válido. | Response.body é instância de Buffer e representa conteúdo PDF. |
