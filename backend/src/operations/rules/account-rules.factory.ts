import { Injectable } from '@nestjs/common';
import { AccountRules } from './account-rules.interface';
import { CheckingAccountRules } from './checking-account-rules';
import { SavingsAccountRules } from './savings-account-rules';
import { InvalidAccountException } from '../../common/exceptions/invalid-account.exception';
import { AccountType } from '@prisma/client';

@Injectable()
export class AccountRulesFactory {
  getRules(type: AccountType): AccountRules {
    switch (type) {
      case AccountType.CHECKING:
        return new CheckingAccountRules();
      case AccountType.SAVINGS:
        return new SavingsAccountRules();
      default:
        throw new InvalidAccountException('Unsupported account type');
    }
  }
}
