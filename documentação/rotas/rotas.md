# Documentação de Endpoints – IFRO Patrimônio  

---  

## 1. /login  

**Caso de Uso**  
 - Permite que o comissionado realize login na plataforma utilizando e-mail e senha.  

**Regras de Negócio**  
- **Verificação de Credenciais:** Validar login/senha ou outro método de autenticação.
- **Bloqueio de Usuários:** Impedir o acesso de usuários inativos ou sem autorização específica.
- **Gestão de Tokens:** Gerar e armazenar tokens de acesso e refresh (se aplicável) de forma segura, permitindo revogação futura.
 

**Resposta**  
- Retorno dos tokens de acesso e refresh (se aplicável).
- Dados básicos do usuário: nome, função, status.  

---  

## 2. /usuarios  
Gerenciamento dos comissionados: criação, edição, listagem e exclusão.  

### 2.1 POST /usuarios  

**Caso de Uso** 
 - Cadastrar novos usuários.  

**Regras de Negócio**  
- **Campos obrigatórios**: `nome`, `CPF`, `função`, `e-mail` e `campus`.  
- **Validações**:
  - Verifica se o `campus` informado é valido e se existe.
  - Verificar se o `CPF` é válido e está no formato correto (xxx.xxx.xxx-xx).
  - Verificar se o `e-mail` está em um formato válido (ex: nome@dominio.com).
- **Exclusividade**:
  - O `CPF` deve ser único no sistema (sem duplicatas).
  - O `e-mail` deve ser único no sistema (sem duplicatas).

**Resposta**  
- Registro de usuário criado com sucesso.
- Retorno do objeto de usuário criado com id único.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 2.2 GET /usuarios  

**Caso de Uso** 
 - Listar todos os usuários cadastrados, com filtros opcionais.  

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra usuários por `nome`, `status` (ativo/inativo) e `campus`.

**Resposta**  
- Retorno de uma lista de usuários conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de usuários e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 2.3 GET /usuarios/:id  

**Caso de Uso** 
 - Obter dados detalhados de um usuário específico.  

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).

**Resposta**  
- Retorno de informações do usuário.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 2.4 PATCH /usuarios/:id  

**Caso de Uso** 
 - Atualizar informações de um usuário.  

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Validações**:
  - Verifica se o `campus` informado é valido e se existe.
  - Verificar se o `CPF` é válido e está no formato correto (xxx.xxx.xxx-xx).
  - Verificar se o `e-mail` está em um formato válido (ex: nome@dominio.com).
- **Exclusividade de Campos:** Manter a unicidade de campos (ex.: `e-mail` e `CPF`).
- **Restrições:** A `senha` não pode ser alterada através desta requisição.  

**Resposta**  
- Registro atualizado com as novas informações.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 2.5 DELETE /usuarios/:id  

**Caso de Uso**  
- Excluir ou inativar um registro que não será mais utilizado.

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Desativação e Exclusão**:  Caso o usuario não tenha relacionamento com nenhum outro documento ele sera exluido, caso contrario A operação deve alterar o campo status de `true` para `false` ao invés de excluir o usuário do sistema.

**Resposta**  
- Registro excluído ou inativado conforme a política definida.
- Em caso de falha, retornar mensagem de erro específica.

---  

## 3. /inventarios  
Gerenciamento de inventários: criação, listagem, edição, exclusão e finalização.  

### 3.1 POST /inventarios  

**Caso de Uso**  
 - Cadastrar novo inventário para registro de levantamentos.  

**Regras de Negócio**  
- **Campos obrigatórios**: `campus`, `nome` e `data`.
- **Validações**:
  - Verifica se o `campus` informado é valido e se existe.
  - Verificar se a `data` informada é válida e está no formato correto (dd/mm/aaaa).

**Resposta**  
- Registro de inventário criado com sucesso.
- Retorno do objeto de inventário criado com id único.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.2 GET /inventarios  

**Caso de Uso** 
 - Listar todos os inventários cadastrados, com filtros opcionais.   

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra inventários por `nome`, `status` (ativo/inativo), `campus` e `data`.

**Resposta**  
- Retorno de uma lista de inventários conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de inventários e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.3 GET /inventarios/:id

**Caso de Uso** 
 - Obter dados detalhados de um inventário específico. 

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).

**Resposta**  
- Retorno de informações do inventário.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.4 PATCH /inventarios/:id  

**Caso de Uso** 
 - Atualizar informações de um inventário.  

**Regras de Negócio**
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Validações:**
  - Verifica se o `campus` informado é valido e se existe.
  - Verificar se a `data` informada é válida e está no formato correto (dd/mm/aaaa).
- **Restrições de Modificação:** caso o status do inventario seja alterado para `false`, o inventário será finalizado e não permitirá mais alterações.  

**Resposta**  
- Registro atualizado com as novas informações.
- Em caso de falha, retornar mensagem de erro específica. 

---  

### 3.5 DELETE /inventarios/:id

**Caso de Uso** 
 - Excluir um inventário que não será mais utilizado.

**Regras de Negócio**
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Desativação e Exclusão**:o inventario só será excluido caso ele não tenha relacionamento com nenhum outro documento.

**Resposta**  
- Inventário excluído.
- Em caso de falha, retornar mensagem de erro específica. 

---

## 4. /campus  
Gerenciamento de campus: criação, listagem, edição e exclusão.  

### 4.1 POST /campus  

**Caso de Uso**  
 - Cadastrar novos campus.  

**Regras de Negócio**  
- **Campos obrigatórios**: `nome` e `cidade`.
- **Exclusividade**: não permitir a criação de um campus com o mesmo `nome` e mesma `cidade`.

**Resposta**  
- Registro de campus criado com sucesso.
- Retorno do objeto de campus criado com id único.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 4.2 GET /campus  

**Caso de Uso** 
 - Listar todos os campus cadastrados, com filtros opcionais.   

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra campus por `nome`, `status` (ativo/inativo) e `cidade`.

**Resposta**  
- Retorno de uma lista de campus conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de campus e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 4.3 GET /campus/:id

**Caso de Uso** 
 - Obter dados detalhados de um campus específico. 

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).

**Resposta**  
- Retorno de informações do campus.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 4.4 PATCH /campus/:id

**Caso de Uso** 
 - Atualizar informações de um campus.  

**Regras de Negócio**
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Validações:**
  - Verificar se já não existe um campus com a mesma combinação de `nome` e `cidade`.

**Resposta**  
- Registro atualizado com as novas informações.
- Em caso de falha, retornar mensagem de erro específica. 

---  

### 4.5 DELETE /campus/:id

**Caso de Uso**  
- Excluir ou inativar um registro que não será mais utilizado.

**Regras de Negócio**
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Desativação e Exclusão**:  Caso o campus não tenha relacionamento com nenhum outro documento ele sera exluido, caso contrario A operação deve alterar o campo status de `true` para `false` ao invés de excluir o campus do sistema.

**Resposta**  
- Registro excluído ou inativado conforme a política definida.
- Em caso de falha, retornar mensagem de erro específica.

---

## 5. /levantamentos 
 - Gerenciamento de levantamentos: cadastro, listagem, edição e exclusão

### 5.1 POST /levantamentos/:idBem

**Caso de Uso**  
 - Cadastrar novo levantamento para registro das informaçoes dos bens.  

**Regras de Negócio**  
**Validações:**
  - Verifica se o `bem` informado é valido e se existe.
  - Verificar se o `resposável` informado é válido e se existe.
  - Verificar se o `inventário` informado é válido, se existe e se seu status é `true`.
  - Verificar se a `sala` informada é válida e se existe.
  - Verificar se a `data` informada é válida e está no formato correto (dd/mm/aaaa).

**Resposta**  
- Registro de levantamento criado com sucesso.
- Retorno do objeto de levantamento criado com id único.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 5.2 POST /levantamentos/:id/foto  

**Caso de Uso**  
 - Adicionar ou atualizar foto do bem.  

**Regras de Negócio**  
**Validações:** 
  - Verifica o tipo do arquivo enviado.
  - Verifica o tamanho do arquivo enviado.

**Resposta**  
- Confirmação de upload.  
- Registro do levantamento no qual a foto foi adicionada.
- Em caso de falha, retornar mensagem de erro específica.
---  

### 5.3 GET /levantamentos

**Caso de Uso**  
 - Listar todos os levantamentos cadastrados, com filtros opcionais.    

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra levantamentos polo `tombo` do bem, `sala` e `inventario` . 

**Resposta**  
- Retorno de uma lista de levantamentos conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de levantamentos e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 5.4 GET /levantamentos/:id  

**Caso de Uso**  
 - Obter dados detalhados de um levantamento específico.    

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).

**Resposta**  
- Retorno de informações do levantamento.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 5.5 DELETE /levantamentos/:id/  

**Caso de Uso** 
- Excluir um levantamento que não será mais utilizado.

**Regras de Negócio**
- **Validação de Existência:** Confirmar se o registro existe e seu `status` (ativo/inativo).
- **Validações:** verificar se o status do inventário no qual o levantamento está vinculado é `true`.

**Resposta**  
- levantamento excluído.
- Em caso de falha, retornar mensagem de erro específica. 

---  

## 6. /bens
Listagem dos bens cadastrados

### 6.1 GET /bens

**Caso de Uso** 
- Listar todos os bens cadastrados, com filtros opcionais.

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra bens por `nome`, `tombo` e `sala`.

**Resposta**  
- Retorno de uma lista de bens conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de bens e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.


---

## 7. /salas
Listagem das salas cadastradas

### 7.1 GET /salas

**Caso de Uso** 
- Listar todos as salas cadastradas, com filtros opcionais.

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra salas por `nome`, `campus` e `bloco`.

**Resposta**  
- Retorno de uma lista de salas conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de salas e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.


---

## 8. /relatorios  
Geração de relatórios filtrados por inventário, sala e tipo.  

### 8.1 GET /relatorios  

**Caso de Uso**   
 - Gerar relatórios com filtros variados e opção de exportação em PDF.  

**Parâmetros de Query**  

| Parâmetro     | Tipo   | Obrigatório | Descrição                                                                                                  |  
|---------------|--------|-------------|------------------------------------------------------------------------------------------------------------|  
| inventarioId  | string | Sim         | Filtra bens pelo inventário.                                                                                |  
| sala          | string | Não         | Filtra bens pela sala.                                                                                      |  
| tipoRelatorio | string | Sim         | Tipo do relatório (ex: geral, bens_nao_encontrados, bens_danificados, bens_ociosos, bens_sem_etiqueta, bens_inserviveis). |  

**Regras de Negócio**  
- **Validações:**
  - Validar existência do `inventário` e `sala` quando informados.  
  - Aplicar filtro conforme o tipo selecionado.   


**Resposta**  
 - Relatório em PDF.
- Em caso de falha, retornar mensagem de erro específica.  

---  

## 9. /csv  
Importação de dados via CSV para bens e salas.  

### 9.1 POST /csv/:campusID  

**Caso de Uso** 
 - Importar registros via arquivo CSV para cadastro de bens e salas.  

**Regras de Negócio** 
- **Validações:**
  - CSV com colunas obrigatórias (ex: `tombo`, `nome`, `sala` e `descrição`).  
  - Validar dados, evitar duplicatas ou atualizar conforme política.  


**Resposta**  
- Cadastro de registros com sucesso.
- Resumo da importação: registros processados, inseridos, atualizados, rejeitados. 
- Em caso de falha, retornar mensagem de erro específica.

---  

### Segurança em todos os endpoints
- **Autenticação via token JWT obrigatório**
- **Controle de acesso com base na função do usuário**
- **Logs de operações críticas**:
  - Cadastro
  - Edição
  - Exclusão
  - Finalização
