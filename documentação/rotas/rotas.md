# Documentação de Endpoints – IFRO Patrimônio  

---  

## 3.1 /login  

**Descrição**  
Permite que o comissário realize login na plataforma utilizando e-mail e senha.  

**Regras de Negócio**  
- Validar credenciais (e-mail e senha).  
- Bloquear usuários inativos ou sem permissão.  

**Resposta**  
Dados básicos do usuário: nome, função, status.  

---  

## 3.2 /usuarios  
Gerenciamento dos comissionados: criação, edição, listagem e exclusão.  

### 3.2.1 POST /usuarios  

**Descrição**  
Cadastrar novos usuários.  

**Regras de Negócio**  
- Campos obrigatórios: nome, CPF, função, e-mail, senha.  
- Verificar exclusividade do CPF e e-mail.  

**Resposta**  
Objeto do usuário criado com ID.  

---  

### 3.2.2 GET /usuarios  

**Descrição**  
Listar todos os usuários cadastrados, com filtros opcionais.  

**Regras de Negócio**  
- Permite paginação e filtros por nome e função.  

**Resposta**  
Lista de usuários com informações básicas.  

---  

### 3.2.3 GET /usuarios/:id  

**Descrição**  
Obter dados detalhados de um usuário específico.  

**Regras de Negócio**  
- Verificar permissão para visualização.  

**Resposta**  
Dados completos do usuário.  

---  

### 3.2.4 PATCH /usuarios/:id  

**Descrição**  
Atualizar informações de um usuário.  

**Regras de Negócio**  
- Garantir unicidade dos campos CPF e e-mail.  
- Somente alterar senha com autorização específica.  

**Resposta**  
Confirmação de atualização.  

---  

### 3.2.5 DELETE /usuarios/:id  

**Descrição**  
Excluir ou inativar usuário.  

**Regras de Negócio**  
- Preferível inativar usuário conforme política.  

**Resposta**  
Confirmação da ação.  

---  

## 3.3 /inventarios  
Gerenciamento de inventários: cadastro e finalização.  

### 3.3.1 POST /inventarios  

**Descrição**  
Cadastrar novo inventário para registro de bens.  

**Regras de Negócio**  
- Campos obrigatórios: localização e nome do inventário.  
- Não permitir duplicidade de inventários ativos no mesmo local.  

**Resposta**  
Inventário criado com ID.  

---  

### 3.3.2 GET /inventarios  

**Descrição**  
Listar inventários, com filtros por campus e status.  

**Regras de Negócio**  
- Filtros permitidos: campus, status (ativo/finalizado).  

**Resposta**  
Lista de inventários com datas e status.  

---  

### 3.3.3 PATCH /inventarios/:id/finalizar  

**Descrição**  
Finalizar inventário, bloqueando alterações.  

**Regras de Negócio**  
- Inventário finalizado não permite mais alterações.  

**Resposta**  
Confirmação da finalização.  

---  

## 3.4 /levantamento  
Visualização, cadastro e edição dos itens patrimoniais.  

### 3.4.1 GET /levantamento?sala=  

**Descrição**  
Listar bens de uma sala específica.  

**Regras de Negócio**  
- Filtragem por sala.  

**Resposta**  
Lista de itens com status de conferência.  

---  

### 3.4.2 GET /levantamento/:tombo  

**Descrição**  
Obter detalhes completos de um bem patrimonial.  

**Regras de Negócio**  
- Retornar fotos, estado, responsável, etc.  

**Resposta**  
Detalhes do bem.  

---  

### 3.4.3 PATCH /levantamento/:id  

**Descrição**  
Atualizar dados do bem.  

**Regras de Negócio**  
- Atualizar descrição, estado, fotos ou status de uso.  

**Resposta**  
Confirmação de atualização.  

---  

### 3.4.5 POST /bens/:id/foto  

**Descrição**  
Adicionar ou atualizar foto do bem.  

**Regras de Negócio**  
- Validar formato e tamanho da imagem.  

**Resposta**  
Confirmação do upload.  

---  

## 3.5 /relatorios  
Geração de relatórios filtrados por inventário, sala e tipo.  

### 3.5.1 GET /relatorios?inventarioId={inventarioId}&sala={sala}&tipoRelatorio={tipoRelatorio}  

**Descrição**  
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

**Descrição**  
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
