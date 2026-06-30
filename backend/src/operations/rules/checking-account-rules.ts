import { AccountRules } from './account-rules.interface';
import { InsufficientFundsException } from '../../common/exceptions/insufficient-funds.exception';

export class CheckingAccountRules implements AccountRules {
  calculateFee(): number {
    return 100; // R$ 1.00 in cents
  }

  validateWithdraw(currentBalance: number, amount: number, fee: number): void {
    if (currentBalance - amount - fee < -50000) {
      throw new InsufficientFundsException(
        'Insufficient funds for this operation (overdraft limit of R$ 500.00 exceeded).',
      );
    }
  }
}
