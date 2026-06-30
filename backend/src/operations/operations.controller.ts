import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('accounts')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Body() withdrawDto: WithdrawDto) {
    return this.operationsService.withdraw(id, withdrawDto.amount);
  }

  @Post(':id/transfer')
  transfer(@Param('id') id: string, @Body() transferDto: TransferDto) {
    return this.operationsService.transfer(
      id,
      transferDto.destinationAccountId,
      transferDto.amount,
    );
  }

  @Get(':id/statement')
  getStatement(@Param('id') id: string) {
    return this.operationsService.getStatement(id);
  }
}
