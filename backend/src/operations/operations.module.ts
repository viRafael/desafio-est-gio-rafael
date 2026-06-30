import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AccountRulesFactory } from './rules/account-rules.factory';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsController],
  providers: [OperationsService, AccountRulesFactory],
})
export class OperationsModule {}
