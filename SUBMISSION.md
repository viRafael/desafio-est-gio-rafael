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

## Exemplo de uso
1. Selecione a conta **"John Doe Checking"** no painel esquerdo.
2. No formulário de saque (**Withdrawal**), insira o valor `50.00` e clique em **Withdraw**.
3. O saldo será atualizado para `R$ 49,00` (descontando a tarifa de R$ 1,00) e a operação será listada no extrato.
4. No formulário de transferência (**Transfer**), selecione a conta de destino, insira o valor `20.00` e clique em **Transfer**. O saldo de ambas as contas atualizará instantaneamente.

## Observações (opcional)
- **Prevenção de Race Conditions:** Utilizado bloqueio pessimista (`SELECT FOR UPDATE` via Prisma `$queryRaw`) dentro de transações de banco de dados para evitar gastos concorrentes duplicados.
- **Design Pattern Strategy:** Regras de negócio e tarifas de saques foram isoladas usando Strategy Pattern (`AccountRules`), permitindo adicionar novos tipos de conta sem alterar a lógica principal.
- **Suíte de Testes:** Cobertura de testes unitários para regras de saques (`npm run test`) e testes End-to-End (`npm run test:e2e`) simulando requisições HTTP reais integradas ao banco de dados.
- **Criação de Contas:** Adicionado bônus no frontend para criação de novas contas diretamente pela tela.
