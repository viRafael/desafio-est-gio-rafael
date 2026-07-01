# Minha Solução — Banco

## Stack
- **Backend:** Node.js (v20+) / NestJS (v10) / TypeScript / Prisma / PostgreSQL
- **Frontend:** HTML / CSS / Vanilla JavaScript (ES Modules)

## Pré-requisitos / dependências
- **Node.js** v20 ou superior
- **Docker** e **Docker Compose**
- Instalação de dependências:
  ```bash
  cd backend && npm install
  ```

## Como executar

### Backend (API)
Obs: Todos os comando abaixo devem ser dentro da pasta /backend

1. Suba o banco no Docker:
   ```bash
   docker-compose up -d
   ```
2. Execute as migrações e o seed:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
3. Inicie o servidor:
   ```bash
   npm run start:dev
   ```
   A API estará rodando em `http://localhost:3033`.

### Frontend
Como o frontend utiliza ES Modules, ele precisa ser executado sob um servidor HTTP local. Escolha uma das opções abaixo para rodá-lo:

* **Opção A (VS Code - Recomendado):** Abra a pasta do projeto no VS Code, abra o arquivo `frontend/index.html` e clique no botão **"Go Live"** (canto inferior direito do VS Code, via extensão *Live Server*). A página abrirá automaticamente no endereço `http://127.0.0.1:5500`.
* **Opção B (Terminal/CLI):** Execute um servidor estático leve via terminal a partir da raiz do projeto:
  ```bash
  npx serve frontend
  ```
  E acesse o endereço indicado (geralmente `http://localhost:3000`).