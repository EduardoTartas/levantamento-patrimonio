# Levantamento de Patrimônio

Sistema para gerenciamento e controle de bens patrimoniais de instituições, desenvolvido em equipe utilizando a metodologia **Scrum**.

---

## 👥 Equipe

- Gustavo
- Eduardo
- Thiago

---

## ✨ Visão Geral

O Levantamento de Patrimônio é uma solução para controle, cadastro e gestão de bens patrimoniais de instituições. O sistema integra diferentes serviços como API, banco de dados MongoDB e armazenamento de arquivos via MinIO, facilitando o acompanhamento dos ativos institucionais de forma eficiente e segura.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/) instalados
- [Node.js 20.14.0](https://nodejs.org/) (opcional, apenas para execução local sem Docker)
- [Git](https://git-scm.com/)

---

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd levantamento-patrimonio
```

---

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações, se necessário. Para desenvolvimento local, as configurações padrão já funcionam.

---

### 3. Execute com Docker (Recomendado)

#### Subir todos os serviços (API, MongoDB, MinIO):

```bash
npm run dev
```

#### Popular banco com dados de exemplo (seeds):

Em outro terminal:
```bash
npm run seed
```

---

### 4. Executar serviços específicos

```bash
# Apenas MongoDB
docker-compose -f docker-compose.dev.yml up mongo -d

# Apenas MinIO
docker-compose -f docker-compose.dev.yml up minio -d
```

---

### 5. Acesso aos serviços

| Serviço              | URL                        | Credenciais            |
|----------------------|----------------------------|------------------------|
| **API**              | http://localhost:3001      | -                      |
| **MinIO Console**    | http://localhost:9001      | Definidas no `.env`    |
| **MongoDB**          | localhost:27017            | Sem autenticação       |

---

### 7. Scripts disponíveis

```bash
npm run dev    # Executa ambiente de desenvolvimento
npm run seed   # Executa seeds no Docker
npm run test   # Executa testes
npm start      # Inicia aplicação (produção)
```

---

### 8. Parar os serviços

```bash
# Para todos os containers
docker-compose -f docker-compose.dev.yml down

# Remover volumes (apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```