import { IsNumber, IsPositive } from 'class-validator';

export class WithdrawDto {
  @IsNumber({}, { message: 'Withdraw amount must be a number.' })
  @IsPositive({ message: 'Withdraw amount must be greater than zero.' })
  amount: number;
}
