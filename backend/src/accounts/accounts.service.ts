import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from 'generated/client/client';
import { AccountNotFoundException } from '../common/exceptions/account-not-found.exception';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountDto) {
    const initialBalanceInCents = Math.round(dto.initialBalance * 100);
    const account = await this.prisma.account.create({
      data: {
        holder: dto.holder,
        type: dto.type,
        balanceInCents: initialBalanceInCents,
      },
    });
    return this.mapToResponse(account);
  }

  async findAll() {
    const accounts = await this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((account) => this.mapToResponse(account));
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });
    if (!account) {
      throw new AccountNotFoundException(`Account with ID ${id} not found.`);
    }
    return this.mapToResponse(account);
  }

  async update(id: string, dto: UpdateAccountDto) {
    await this.findOne(id);

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: {
        holder: dto.holder,
        type: dto.type,
      },
    });
    return this.mapToResponse(updatedAccount);
  }

  async remove(id: string) {
    await this.findOne(id);

    const deletedAccount = await this.prisma.account.delete({
      where: { id },
    });
    return this.mapToResponse(deletedAccount);
  }

  private mapToResponse(account: Account) {
    return {
      id: account.id,
      holder: account.holder,
      type: account.type,
      balance: account.balanceInCents / 100,
      createdAt: account.createdAt,
    };
  }
}
