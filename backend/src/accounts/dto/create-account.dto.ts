import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { AccountType } from 'generated/client/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Holder name is required.' })
  holder: string;

  @IsEnum(AccountType, {
    message: 'Account type must be CHECKING or SAVINGS.',
  })
  type: AccountType;

  @IsNumber({}, { message: 'Initial balance must be a number.' })
  @Min(0, { message: 'Initial balance cannot be negative.' })
  initialBalance: number;
}
