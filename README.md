# Projeto: Levantamento de Patrimônio 

### Equipe
- Gustavo
- Eduardo
- Thiago

## Visão Geral  
Sistema para gerenciamento e controle de bens patrimoniais, desenvolvido com metodologia **Scrum** em 2 sprints.  

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20.14.0 (caso queira executar localmente)
- Git

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd levantamento-patrimonio
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
# (Para desenvolvimento local, as configurações padrão já funcionam)
```

### 3. Execute com Docker (Recomendado)

#### Desenvolvimento
```bash
# Inicia todos os serviços (API, MongoDB, MinIO)
npm run dev
```

#### Executar seeds (dados de exemplo)
```bash
# Em outro terminal, execute as seeds
npm run seed
```

### 4. Executar apenas serviços específicos
```bash
# Apenas MongoDB
docker-compose -f docker-compose.dev.yml up mongo -d

# Apenas MinIO
docker-compose -f docker-compose.dev.yml up minio -d
```

### 5. Acesso aos serviços

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **API** | http://localhost:3001 | - |
| **MinIO Console** | http://localhost:9001 | Definidas no .env |
| **MongoDB** | localhost:27017 | Sem autenticação |

### 6. Usuário padrão (após executar seeds)
- **Email:** admin@admin.com
- **Senha:** admin
- **Cargo:** Funcionario Cpalm

### 7. Scripts disponíveis
```bash
npm run dev          # Executa ambiente de desenvolvimento
npm run seed         # Executa seeds no Docker
npm run test         # Executa testes
npm start           # Inicia aplicação (produção)
```

### 8. Parar os serviços
```bash
# Para todos os containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```


