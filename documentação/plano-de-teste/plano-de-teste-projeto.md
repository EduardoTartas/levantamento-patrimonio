# Plano de Teste

**Projeto Levantamento de Patrimônio**

*versão 1.0*

## Histórico das alterações 

   Data    | Versão |    Descrição   | Autor(a)
-----------|--------|----------------|-----------------
22/05/2025 |  1.0   | Primeira Versão Da API | Eduardo dos Santos Tartas


## 1 - Introdução

O presente sistema tem como objetivo informatizar a gestão de uma biblioteca, oferecendo funcionalidades que abrangem o cadastro de livros, controle de empréstimos e devoluções, gerenciamento de usuários (alunos, funcionários e administradores), e aplicação de regras específicas como limite de empréstimos e cálculo de multas por atraso.

Este plano de teste descreve os cenários, critérios de aceitação e verificações que serão aplicados sobre as principais funcionalidades do sistema, visando garantir o correto funcionamento das regras de negócio, a integridade dos dados e a experiência do usuário.


## 2 - Arquitetura da API

A aplicação adota uma arquitetura modular em camadas, implementada com as tecnologias Node.js, Express, MongoDB (via Mongoose), Zod para validação de dados, JWT para autenticação e Swagger para documentação interativa da API. O objetivo é garantir uma estrutura clara, escalável e de fácil manutenção, com separação de responsabilidades e aderência a boas práticas de desenvolvimento backend.

### Camadas;

**Routes**: Responsável por definir os endpoints da aplicação e encaminhar as requisições para os controllers correspondentes. Cada recurso do sistema possui um arquivo de rotas dedicado.

**Controllers**: Gerenciam a entrada das requisições HTTP, realizam a validação de dados com Zod e invocam os serviços adequados. Também são responsáveis por formatar e retornar as respostas.

**Services**: Esta camada centraliza as regras de negócio do sistema. Ela abstrai a lógica do domínio, orquestra operações e valida fluxos antes de interagir com a base de dados.

**Repositories**: Encapsulam o acesso aos dados por meio dos modelos do Mongoose, garantindo que a manipulação do banco esteja isolada da lógica de negócio.

**Models**: Definem os esquemas das coleções do MongoDB, com o uso de Mongoose, representando as entidades principais do sistema como livros, leitores e empréstimos.

**Validations**: Utiliza Zod para garantir que os dados recebidos nas requisições estejam no formato esperado, aplicando validações personalizadas e mensagens de erro claras.

**Middlewares**: Implementam funcionalidades transversais, como autenticação de usuários com JWT, tratamento global de erros, e controle de permissões por tipo de perfil.

Existe um documento demonstrando quando e como aplicar as validações link: https://docs.google.com/document/d/1m2Ns1rIxpUzG5kRsgkbaQFdm7od0e7HSHfaSrrwegmM/edit?usp=sharing

## 3 - Categorização dos Requisitos em Funcionais x Não Funcionais

| Código | Requisito Funcional                                                                                   | Regra de Negócio Associada                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| RF000  | O sistema deve permitir que o comissário realize login na plataforma com e-mail e senha.           | O login deve ser validado com autenticação segura (ex: hash de senha).                                      |
| RF001  | O sistema deve permitir a importação de arquivos CSV contendo dados de levantamentos anteriores.     | O sistema deve validar o formato e o conteúdo dos arquivos antes da importação.                             |
| RF002  | O sistema deve ser capaz de fornecer os dados dos itens de um determinado setor para visualização.   | A visualização deve incluir detalhes específicos de cada item do inventário.                                 |
| RF003  | O sistema deve permitir a inspeção detalhada de cada item do inventário.                             | O usuário poderá visualizar informações completas de um item selecionado.                                     |
| RF004  | O sistema deve permitir a administração de comissionados, incluindo cadastrar, atualizar, e excluir usuários. | Apenas usuários autorizados podem realizar essas ações.                                                      |
| RF005  | O sistema deve permitir o cadastro de novos inventários para o tombamento dos itens por sala.        | Um inventário só pode ser cadastrado se incluir detalhes necessários, como localização e data.              |
| RF006  | O sistema deve permitir a finalização do inventário, não permitindo mais alterações.                  | Um inventário finalizado bloqueará todas as operações de modificação subsequentes para garantir a integridade.|
| RF007  | O sistema deve permitir ao usuário emitir relatórios.                                                  | Os relatórios devem ser personalizáveis e podem incluir diferentes parâmetros de filtragem.                   |

| Código | Requisito Funcional Desejável                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------- |
| RF008  | O sistema deve facilitar a conferência dos bens, tornando o acesso mais rápido.                       |
| RF009  | O sistema deve melhorar o acesso em dispositivos móveis.                                             |
| RF010  | O sistema deve permitir visualizar um histórico detalhado de atividades e alterações.                 |


| Código | Requisito Não Funcional                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| RNF000 | O sistema deve garantir a segurança das informações do inventário, restringindo o acesso apenas a usuários autorizados através de autenticação segura. |
| RNF001 | O sistema deve fornecer uma interface do usuário intuitiva e de fácil utilização, mesmo para usuários sem experiência técnica. |
| RNF002 | O sistema deve manter a disponibilidade 24/7, com tempo de inatividade mínimo planejado para manutenção. |
| RNF003 | O sistema deve implementar mecanismos que permitam a correta gestão de falhas, preservando a integridade dos dados do inventário. |
| RNF004 | O sistema deve estar em conformidade com as normas locais relacionadas à gestão de inventário e dados. |


## 4 - Casos de Teste
Os casos de teste serão implementados ao longo do desenvolvimento, organizados em arquivos complementares. De forma geral, serão considerados cenários de sucesso, cenários de falha e as regras de negócio associadas a cada funcionalidade.


## 5 - Estratégia de Teste

A estratégia de teste adotada neste projeto busca garantir a qualidade funcional e estrutural do sistema da biblioteca por meio da aplicação de testes em múltiplos níveis, alinhados ao ciclo de desenvolvimento.

Serão executados testes em todos os níveis conforme a descrição abaixo.

**Testes Unitários**: Focados em verificar o comportamento isolado das funções, serviços e regras de negócio, o código terá uma cobertura de 70% de testes unitários, que são de responsabilidade dos desenvolvedores.

**Testes de Integração**: Verificarão a interação entre diferentes camadas (ex: controller + service + repository) e a integração com o banco de dados, serão executados testes de integração em todos os endpoints, e esses testes serão dos desenvolvedores.

**Testes Manuais**: Realizados pontualmente na API por meio do Swagger ou Postman, com o objetivo de validar diferentes fluxos de uso e identificar comportamentos inesperados durante o desenvolvimento. A execução desses testes é de responsabilidade dos desenvolvedores, tanto durante quanto após a implementação das funcionalidades.

Os testes serão implementados de forma incremental, acompanhando o desenvolvimento das funcionalidades. Cada funcionalidade terá seu próprio plano de teste específico, com os casos detalhados, critérios de aceitação e cenários de sucesso e falha.


## 6 -	Ambiente e Ferramentas

Os testes serão feitos do ambiente de desenvolvimento, e contém as mesmas configurações do ambiente de produção.

As seguintes ferramentas serão utilizadas no teste:

Ferramenta | 	Time |	Descrição 
-----------|--------|--------
POSTMAN, Swagger UI 	| Desenvolvimento|	Ferramenta para realização de testes manuais de API
Jest|	Desenvolvimento |Framework utilizada para testes unitários e integração
Supertest|	Desenvolvimento|	Framework utilizada para testes de endpoints REST
MongoDB Memory Server|	Desenvolvimento|	Para testes com banco em memória, garantindo isolamento dos dados


## 7 - Classificação de Bugs

Os Bugs serão classificados com as seguintes severidades:

ID 	|Nivel de Severidade |	Descrição 
-----------|--------|--------
1	|Blocker |	●	Bug que bloqueia o teste de uma função ou feature causa crash na aplicação. <br>●	Botão não funciona impedindo o uso completo da funcionalidade. <br>●	Bloqueia a entrega. 
2	|Grave |	●	Funcionalidade não funciona como o esperado <br>●	Input incomum causa efeitos irreversíveis
3	|Moderada |	●	Funcionalidade não atinge certos critérios de aceitação, mas sua funcionalidade em geral não é afetada <br>●	Mensagem de erro ou sucesso não é exibida
4	|Pequena |	●	Quase nenhum impacto na funcionalidade porém atrapalha a experiência  <br>●	Erro ortográfico<br>● Pequenos erros de UI


### 8 - 	Definição de Pronto 
Será considerada pronta as funcionalidades que passarem pelas verificações e testes descritas nos casos de teste, não apresentarem bugs com a severidade acima de moderada, e passarem por uma validação da equipe.
