import { AccountRules } from './account-rules.interface';
import { InsufficientFundsException } from '../../common/exceptions/insufficient-funds.exception';

export class SavingsAccountRules implements AccountRules {
  calculateFee(): number {
    return 0;
  }

  validateWithdraw(currentBalance: number, amount: number, fee: number): void {
    if (currentBalance - amount - fee < 0) {
      throw new InsufficientFundsException(
        'Insufficient funds for this operation (savings account cannot have a negative balance).',
      );
    }
  }
}
