import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AccountRulesFactory } from './rules/account-rules.factory';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';
import { InvalidAccountException } from '../common/exceptions/invalid-account.exception';
import { TransactionType } from 'generated/client/client';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesFactory: AccountRulesFactory,
  ) {}

  async withdraw(accountId: string, amount: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new AccountNotFoundException(
        `Account with ID ${accountId} not found.`,
      );
    }

    const rules = this.rulesFactory.getRules(account.type);
    const fee = rules.calculateFee();
    const amountInCents = Math.round(amount * 100);

    rules.validateWithdraw(account.balanceInCents, amountInCents, fee);

    const txResult = await this.prisma.$transaction(async (tx) => {
      const currentAccount = await tx.account.findUnique({
        where: { id: accountId },
      });
      if (!currentAccount) {
        throw new AccountNotFoundException(
          `Account with ID ${accountId} not found.`,
        );
      }

      rules.validateWithdraw(currentAccount.balanceInCents, amountInCents, fee);

      const newBalance = currentAccount.balanceInCents - amountInCents - fee;

      await tx.account.update({
        where: { id: accountId },
        data: { balanceInCents: newBalance },
      });

      await tx.transaction.create({
        data: {
          accountId,
          type: TransactionType.WITHDRAWAL,
          amountInCents,
          feeInCents: fee,
          balanceAfter: newBalance,
        },
      });

      return {
        previousBalance: currentAccount.balanceInCents,
        currentBalance: newBalance,
      };
    });

    return {
      accountId,
      operationType: TransactionType.WITHDRAWAL,
      amount,
      fee: fee / 100,
      previousBalance: txResult.previousBalance / 100,
      currentBalance: txResult.currentBalance / 100,
    };
  }

  async transfer(
    sourceAccountId: string,
    destinationAccountId: string,
    amount: number,
  ) {
    if (sourceAccountId === destinationAccountId) {
      throw new InvalidAccountException('Cannot transfer to the same account.');
    }

    const sourceAccount = await this.prisma.account.findUnique({
      where: { id: sourceAccountId },
    });
    if (!sourceAccount) {
      throw new AccountNotFoundException(
        `Source account with ID ${sourceAccountId} not found.`,
      );
    }

    const destinationAccount = await this.prisma.account.findUnique({
      where: { id: destinationAccountId },
    });
    if (!destinationAccount) {
      throw new AccountNotFoundException(
        `Destination account with ID ${destinationAccountId} not found.`,
      );
    }

    const rules = this.rulesFactory.getRules(sourceAccount.type);
    const fee = rules.calculateFee();
    const amountInCents = Math.round(amount * 100);

    rules.validateWithdraw(sourceAccount.balanceInCents, amountInCents, fee);

    const txResult = await this.prisma.$transaction(async (tx) => {
      const currentSource = await tx.account.findUnique({
        where: { id: sourceAccountId },
      });
      if (!currentSource) {
        throw new AccountNotFoundException(
          `Source account with ID ${sourceAccountId} not found.`,
        );
      }

      const currentDest = await tx.account.findUnique({
        where: { id: destinationAccountId },
      });
      if (!currentDest) {
        throw new AccountNotFoundException(
          `Destination account with ID ${destinationAccountId} not found.`,
        );
      }

      rules.validateWithdraw(currentSource.balanceInCents, amountInCents, fee);

      const newSourceBalance =
        currentSource.balanceInCents - amountInCents - fee;
      const newDestBalance = currentDest.balanceInCents + amountInCents;

      await tx.account.update({
        where: { id: sourceAccountId },
        data: { balanceInCents: newSourceBalance },
      });

      await tx.account.update({
        where: { id: destinationAccountId },
        data: { balanceInCents: newDestBalance },
      });

      await tx.transaction.create({
        data: {
          accountId: sourceAccountId,
          type: TransactionType.TRANSFER_SENT,
          amountInCents,
          feeInCents: fee,
          balanceAfter: newSourceBalance,
          relatedAccountId: destinationAccountId,
        },
      });

      await tx.transaction.create({
        data: {
          accountId: destinationAccountId,
          type: TransactionType.TRANSFER_RECEIVED,
          amountInCents,
          feeInCents: 0,
          balanceAfter: newDestBalance,
          relatedAccountId: sourceAccountId,
        },
      });

      return {
        previousBalance: currentSource.balanceInCents,
        currentBalance: newSourceBalance,
      };
    });

    return {
      sourceAccountId,
      destinationAccountId,
      operationType: 'TRANSFER',
      amount,
      fee: fee / 100,
      previousBalance: txResult.previousBalance / 100,
      currentBalance: txResult.currentBalance / 100,
    };
  }

  async getStatement(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new AccountNotFoundException(
        `Account with ID ${accountId} not found.`,
      );
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        relatedAccount: true,
      },
    });

    return {
      account: {
        id: account.id,
        holder: account.holder,
        type: account.type,
        balance: account.balanceInCents / 100,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amountInCents / 100,
        fee: t.feeInCents / 100,
        balanceAfter: t.balanceAfter / 100,
        createdAt: t.createdAt,
        relatedAccount: t.relatedAccount
          ? {
              id: t.relatedAccount.id,
              holder: t.relatedAccount.holder,
              type: t.relatedAccount.type,
            }
          : null,
      })),
    };
  }
}
