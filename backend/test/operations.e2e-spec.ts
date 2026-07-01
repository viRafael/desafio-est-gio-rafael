import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { AccountType } from '@prisma/client';

describe('Operations E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let checkingAccountId: string;
  let savingsAccountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate global pipes and filters used in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up to ensure a clean state
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await app.close();
  });

  describe('POST /accounts', () => {
    it('should create a CHECKING account', async () => {
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          holder: 'E2E John Checking',
          type: AccountType.CHECKING,
          initialBalance: 100.0, // R$ 100.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.holder).toBe('E2E John Checking');
      expect(response.body.type).toBe(AccountType.CHECKING);
      expect(response.body.balance).toBe(100.0);

      checkingAccountId = response.body.id;
    });

    it('should create a SAVINGS account', async () => {
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          holder: 'E2E Jane Savings',
          type: AccountType.SAVINGS,
          initialBalance: 200.0, // R$ 200.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.holder).toBe('E2E Jane Savings');
      expect(response.body.type).toBe(AccountType.SAVINGS);
      expect(response.body.balance).toBe(200.0);

      savingsAccountId = response.body.id;
    });

    it('should reject invalid account type', async () => {
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          holder: 'Invalid User',
          type: 'INVESTIMENTO',
          initialBalance: 50.0,
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Account type must be CHECKING or SAVINGS.',
      );
    });
  });

  describe('POST /accounts/:id/withdraw', () => {
    it('should successfully perform withdrawal on checking account (deducting fee)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/accounts/${checkingAccountId}/withdraw`)
        .send({ amount: 50.0 })
        .expect(201);

      // Previous: 100.00. Withdraw: 50.00 + 1.00 fee. Final: 49.00
      expect(response.body.amount).toBe(50.0);
      expect(response.body.fee).toBe(1.0);
      expect(response.body.previousBalance).toBe(100.0);
      expect(response.body.currentBalance).toBe(49.0);
    });

    it('should allow checking account to go negative up to -R$ 500.00 overdraft limit', async () => {
      const response = await request(app.getHttpServer())
        .post(`/accounts/${checkingAccountId}/withdraw`)
        .send({ amount: 500.0 }) // balance after: 49.00 - 500.00 - 1.00 fee = -452.00 (within limit)
        .expect(201);

      expect(response.body.currentBalance).toBe(-452.0);
    });

    it('should reject withdrawal on checking account if exceeding R$ 500.00 overdraft limit', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${checkingAccountId}/withdraw`)
        .send({ amount: 100.0 }) // would make: -452.00 - 100.00 - 1.00 fee = -553.00 (exceeds limit -500.00)
        .expect(400);
    });

    it('should reject withdrawal on savings account if it would make balance negative', async () => {
      await request(app.getHttpServer())
        .post(`/accounts/${savingsAccountId}/withdraw`)
        .send({ amount: 250.0 }) // balance: 200.00, amount: 250.00
        .expect(400);
    });
  });

  describe('POST /accounts/:id/transfer', () => {
    it('should successfully transfer funds between savings (src) and checking (dest)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/accounts/${savingsAccountId}/transfer`)
        .send({
          destinationAccountId: checkingAccountId,
          amount: 50.0,
        })
        .expect(201);

      // Savings: 200.00 - 50.00 - 0.00 fee = 150.00
      expect(response.body.currentBalance).toBe(150.0);
      expect(response.body.fee).toBe(0);

      // Verify checking account received it: previous: -452.00, received: 50.00 -> -402.00
      const checkingDetails = await request(app.getHttpServer())
        .get(`/accounts/${checkingAccountId}`)
        .expect(200);

      expect(checkingDetails.body.balance).toBe(-402.0);
    });

    it('should reject transfer to self', async () => {
      const response = await request(app.getHttpServer())
        .post(`/accounts/${savingsAccountId}/transfer`)
        .send({
          destinationAccountId: savingsAccountId,
          amount: 10.0,
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Cannot transfer to the same account.',
      );
    });
  });

  describe('GET /accounts/:id/statement', () => {
    it('should retrieve statement with transaction log details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/accounts/${savingsAccountId}/statement`)
        .expect(200);

      expect(response.body).toHaveProperty('account');
      expect(response.body.account.holder).toBe('E2E Jane Savings');
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions.length).toBeGreaterThan(0);
      expect(response.body.transactions[0].type).toBe('TRANSFER_SENT');
      expect(response.body.transactions[0].amount).toBe(50.0);
    });
  });
});
