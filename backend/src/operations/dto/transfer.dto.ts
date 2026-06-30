import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class TransferDto {
  @IsUUID('4', { message: 'Destination account ID must be a valid UUID.' })
  destinationAccountId: string;

  @IsNumber({}, { message: 'Transfer amount must be a number.' })
  @IsPositive({ message: 'Transfer amount must be greater than zero.' })
  amount: number;
}
