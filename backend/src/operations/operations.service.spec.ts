import { Test, TestingModule } from '@nestjs/testing';
import { OperationsService } from './operations.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AccountRulesFactory } from './rules/account-rules.factory';
import { AccountType, TransactionType } from '@prisma/client';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';
import { InvalidAccountException } from '../common/exceptions/invalid-account.exception';
import { InsufficientFundsException } from '../common/exceptions/insufficient-funds.exception';

describe('OperationsService', () => {
  let service: OperationsService;
  let prismaMock: any;

  beforeEach(async () => {
    // Mocking PrismaService with a self-resolving $transaction implementation
    prismaMock = {
      account: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        AccountRulesFactory,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<OperationsService>(OperationsService);
  });

  describe('withdraw', () => {
    it('should successfully perform withdrawal on checking account with fee', async () => {
      const mockAccount = {
        id: 'acc-1',
        holder: 'John Doe',
        type: AccountType.CHECKING,
        balanceInCents: 10000, // R$ 100.00
      };

      prismaMock.account.findUnique.mockResolvedValue(mockAccount);
      prismaMock.account.update.mockResolvedValue({
        ...mockAccount,
        balanceInCents: 4900, // 10000 - 5000 (amount) - 100 (fee) = 4900 cents
      });

      const result = await service.withdraw('acc-1', 50.0);

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
      });
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balanceInCents: 4900 },
      });
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'acc-1',
          type: TransactionType.WITHDRAWAL,
          amountInCents: 5000,
          feeInCents: 100,
          balanceAfter: 4900,
        },
      });

      expect(result).toEqual({
        accountId: 'acc-1',
        operationType: TransactionType.WITHDRAWAL,
        amount: 50.0,
        fee: 1.0,
        previousBalance: 100.0,
        currentBalance: 49.0,
      });
    });

    it('should throw AccountNotFoundException if account does not exist', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      await expect(service.withdraw('invalid-acc', 50.0)).rejects.toThrow(
        AccountNotFoundException,
      );
    });

    it('should throw InsufficientFundsException if withdrawal exceeds balance + limit', async () => {
      const mockAccount = {
        id: 'acc-1',
        holder: 'John Doe',
        type: AccountType.CHECKING,
        balanceInCents: 0,
      };

      prismaMock.account.findUnique.mockResolvedValue(mockAccount);

      // Attempt to withdraw R$ 600.00 (which exceeds limit R$ 500.00 + R$ 1.00 fee)
      await expect(service.withdraw('acc-1', 600.0)).rejects.toThrow(
        InsufficientFundsException,
      );
    });
  });

  describe('transfer', () => {
    it('should successfully perform transfer between checking and savings accounts', async () => {
      const sourceAcc = {
        id: 'src-1',
        holder: 'John Doe',
        type: AccountType.CHECKING,
        balanceInCents: 10000, // R$ 100.00
      };
      const destAcc = {
        id: 'dest-1',
        holder: 'Jane Doe',
        type: AccountType.SAVINGS,
        balanceInCents: 5000, // R$ 50.00
      };

      prismaMock.account.findUnique
        .mockResolvedValueOnce(sourceAcc) // First call outside tx (src)
        .mockResolvedValueOnce(destAcc) // Second call outside tx (dest)
        .mockResolvedValueOnce(sourceAcc) // First call inside tx (src)
        .mockResolvedValueOnce(destAcc); // Second call inside tx (dest)

      const result = await service.transfer('src-1', 'dest-1', 40.0);

      // Source: 10000 - 4000 (amount) - 100 (fee) = 5900 cents (R$ 59.00)
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: 'src-1' },
        data: { balanceInCents: 5900 },
      });
      // Destination: 5000 + 4000 (amount) = 9000 cents (R$ 90.00)
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: 'dest-1' },
        data: { balanceInCents: 9000 },
      });

      // Assert transactions created
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'src-1',
          type: TransactionType.TRANSFER_SENT,
          amountInCents: 4000,
          feeInCents: 100,
          balanceAfter: 5900,
          relatedAccountId: 'dest-1',
        },
      });

      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: {
          accountId: 'dest-1',
          type: TransactionType.TRANSFER_RECEIVED,
          amountInCents: 4000,
          feeInCents: 0,
          balanceAfter: 9000,
          relatedAccountId: 'src-1',
        },
      });

      expect(result).toEqual({
        sourceAccountId: 'src-1',
        destinationAccountId: 'dest-1',
        operationType: 'TRANSFER',
        amount: 40.0,
        fee: 1.0,
        previousBalance: 100.0,
        currentBalance: 59.0,
      });
    });

    it('should throw InvalidAccountException if source and destination accounts are the same', async () => {
      await expect(service.transfer('acc-1', 'acc-1', 10.0)).rejects.toThrow(
        InvalidAccountException,
      );
    });

    it('should throw AccountNotFoundException if source or destination does not exist', async () => {
      prismaMock.account.findUnique.mockResolvedValueOnce(null); // source not found

      await expect(
        service.transfer('invalid-src', 'dest-1', 10.0),
      ).rejects.toThrow(AccountNotFoundException);
    });
  });

  describe('getStatement', () => {
    it('should return statement with mapped transactions', async () => {
      const mockAccount = {
        id: 'acc-1',
        holder: 'John Doe',
        type: AccountType.CHECKING,
        balanceInCents: 10000,
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          type: TransactionType.WITHDRAWAL,
          amountInCents: 5000,
          feeInCents: 100,
          balanceAfter: 4900,
          createdAt: new Date('2026-06-30T15:00:00Z'),
          relatedAccount: null,
        },
      ];

      prismaMock.account.findUnique.mockResolvedValue(mockAccount);
      prismaMock.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getStatement('acc-1');

      expect(result).toEqual({
        account: {
          id: 'acc-1',
          holder: 'John Doe',
          type: AccountType.CHECKING,
          balance: 100.0,
        },
        transactions: [
          {
            id: 'tx-1',
            type: TransactionType.WITHDRAWAL,
            amount: 50.0,
            fee: 1.0,
            balanceAfter: 49.0,
            createdAt: mockTransactions[0].createdAt,
            relatedAccount: null,
          },
        ],
      });
    });
  });
});
