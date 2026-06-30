import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountType } from 'generated/client/client';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  holder?: string;

  @IsEnum(AccountType, {
    message: 'Account type must be CHECKING or SAVINGS.',
  })
  @IsOptional()
  type?: AccountType;
}
