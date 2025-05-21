# Documentação de Endpoints – IFRO Patrimônio  

---  

## 3.1 /login  

**Caso de Uso**  
Permite que o comissionado realize login na plataforma utilizando e-mail e senha.  

**Regras de Negócio**  
- **Verificação de Credenciais:** Validar login/senha ou outro método de autenticação.
- **Bloqueio de Usuários:** Impedir o acesso de usuários inativos ou sem autorização específica.
- **Gestão de Tokens:** Gerar e armazenar tokens de acesso e refresh (se aplicável) de forma segura, permitindo revogação futura.
 

**Resposta**  
- Retorno dos tokens de acesso e refresh (se aplicável).
- Dados básicos do usuário: nome, função, status.  

---  

## 3.2 /usuarios  
Gerenciamento dos comissionados: criação, edição, listagem e exclusão.  

### 3.2.1 POST /usuarios  

**Caso de Uso** 
Cadastrar novos usuários.  

**Regras de Negócio**  
- **Campos obrigatórios**: nome, CPF, função, e-mail e campus.  
- **Validações**:
  - Verifica se o campus informado é valido e se existe.
  - Verificar se o CPF é válido e está no formato correto (xxx.xxx.xxx-xx).
  - Verificar se o e-mail está em um formato válido (ex: nome@dominio.com).
- **Exclusividade**:
  - O CPF deve ser único no sistema (sem duplicatas).
  - O e-mail deve ser único no sistema (sem duplicatas).

**Resposta**  
- Registro de usuário criado com sucesso.
- Retorno do objeto de usuário criado com id único.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.2.2 GET /usuarios  

**Caso de Uso** 
Listar todos os usuários cadastrados, com filtros opcionais.  

**Regras de Negócio**  
- **Paginação**: Permite especificar `page` e `limite` para controle de resultados.
- **Filtros**: Filtra usuários por nome, status (ativo/inativo) e campus.

**Resposta**  
- Retorno de uma lista de usuários conforme os filtros aplicados.
- Inclusão de informações adicionais como contagem total de usuários e dados da página atual.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.2.3 GET /usuarios/:id  

**Caso de Uso** 
Obter dados detalhados de um usuário específico.  

**Regras de Negócio**  
- **Validação de Existência:** Confirmar se o registro existe e seu status (ativo/inativo).

**Resposta**  
- Retorno de informações do usuário.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.2.4 PATCH /usuarios/:id  

**Caso de Uso** 
Atualizar informações de um usuário.  

**Regras de Negócio**  
- **Validações**:
  - Verifica se o campus informado é valido e se existe.
  - Verificar se o CPF é válido e está no formato correto (xxx.xxx.xxx-xx).
  - Verificar se o e-mail está em um formato válido (ex: nome@dominio.com).
- **Exclusividade de Campos:** Manter a unicidade de campos (ex.: e-mail e CPF).
- **Restrições:** A senha não pode ser alterada através desta requisição.  

**Resposta**  
- Registro atualizado com as novas informações.
- Em caso de falha, retornar mensagem de erro específica.

---  

### 3.2.5 DELETE /usuarios/:id  

**Caso de Uso**  
- Excluir ou inativar um registro que não será mais utilizado.

**Regras de Negócio**  
- **Desativação e Exclusão**:  Caso o usuario não tenha relacionamento com nenhum outro documento ele sera exluido, caso contrario A operação deve alterar o campo status de `true` para `false` ao invés de excluir o usuário do sistema.


**Resposta**  
- Registro excluído ou inativado conforme a política definida.
- Em caso de falha, retornar mensagem de erro específica.

---  

## 3.3 /inventarios  
Gerenciamento de inventários: cadastro e finalização.  

### 3.3.1 POST /inventarios  

**Caso de Uso**  
Cadastrar novo inventário para registro de bens.  

**Regras de Negócio**  
- Campos obrigatórios: localização e nome do inventário.  
- Não permitir duplicidade de inventários ativos no mesmo local.  

**Resposta**  
Inventário criado com ID.  

---  

### 3.3.2 GET /inventarios  

**Caso de Uso** 
Listar inventários, com filtros por campus e status.  

**Regras de Negócio**  
- Filtros permitidos: campus, status (ativo/finalizado).  

**Resposta**  
Lista de inventários com datas e status.  

---  

### 3.3.3 PATCH /inventarios/:id/finalizar  

**Caso de Uso** 
Finalizar inventário, bloqueando alterações.  

**Regras de Negócio**  
- Inventário finalizado não permite mais alterações.  

**Resposta**  
Confirmação da finalização.  

---  

## 3.4 /levantamento  
Visualização, cadastro e edição dos itens patrimoniais.  

### 3.4.1 GET /levantamento?sala=  

**Caso de Uso**  
Listar bens de uma sala específica.  

**Regras de Negócio**  
- Filtragem por sala.  

**Resposta**  
Lista de itens com status de conferência.  

---  

### 3.4.2 GET /levantamento/:tombo  

**Caso de Uso**  
Obter detalhes completos de um bem patrimonial.  

**Regras de Negócio**  
- Retornar fotos, estado, responsável, etc.  

**Resposta**  
Detalhes do bem.  

---  

### 3.4.3 PATCH /levantamento/:id  

**Caso de Uso**  
Atualizar dados do bem.  

**Regras de Negócio**  
- Atualizar descrição, estado, fotos ou status de uso.  

**Resposta**  
Confirmação de atualização.  

---  

### 3.4.5 POST /levantamento/:id/foto  

**Caso de Uso**  
Adicionar ou atualizar foto do bem.  

**Regras de Negócio**  
- Validar formato e tamanho da imagem.  

**Resposta**  
Confirmação do upload.  

---  

## 3.5 /relatorios  
Geração de relatórios filtrados por inventário, sala e tipo.  

### 3.5.1 GET /relatorios?inventarioId={inventarioId}&sala={sala}&tipoRelatorio={tipoRelatorio}  

**Caso de Uso**   
Gerar relatórios com filtros variados e opção de exportação em PDF.  

**Parâmetros de Query**  

| Parâmetro     | Tipo   | Obrigatório | Descrição                                                                                                  |  
|---------------|--------|-------------|------------------------------------------------------------------------------------------------------------|  
| inventarioId  | string | Sim         | Filtra bens pelo inventário.                                                                                |  
| sala          | string | Não         | Filtra bens pela sala.                                                                                      |  
| tipoRelatorio | string | Sim         | Tipo do relatório (ex: geral, bens_nao_encontrados, bens_danificados, bens_ociosos, bens_sem_etiqueta, bens_inserviveis). |  

**Regras de Negócio**  
- Validar existência do inventário/sala quando informados.  
- Aplicar filtro conforme tipo.   
- Registrar logs.  

**Resposta**  
Relatório em JSON ou PDF.  

---  

## 3.6 /importacao  
Importação de dados via CSV para bens e salas.  

### 3.6.1 POST /importacao/csv  

**Caso de Uso** 
Importar registros via arquivo CSV para cadastro de bens e salas.  

**Regras de Negócio**  
- CSV com colunas obrigatórias (ex: tombo, nome, sala, localização, estado).  
- Validar dados, evitar duplicatas ou atualizar conforme política.  
- Registrar logs.  


**Resposta**  
Resumo da importação: registros processados, inseridos, atualizados, rejeitados.  

---  

### Segurança em todos os endpoints
- **Autenticação via token JWT obrigatório**
- **Controle de acesso com base na função do usuário**
- **Logs de operações críticas**:
  - Cadastro
  - Edição
  - Exclusão
  - Finalização
