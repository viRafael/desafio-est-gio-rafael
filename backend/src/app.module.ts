import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [PrismaModule, AccountsModule, OperationsModule],
})
export class AppModule {}
