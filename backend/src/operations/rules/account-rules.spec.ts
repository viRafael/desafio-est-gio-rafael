import { CheckingAccountRules } from './checking-account-rules';
import { SavingsAccountRules } from './savings-account-rules';
import { AccountRulesFactory } from './account-rules.factory';
import { AccountType } from '@prisma/client';
import { InsufficientFundsException } from '../../common/exceptions/insufficient-funds.exception';
import { InvalidAccountException } from '../../common/exceptions/invalid-account.exception';

describe('CheckingAccountRules', () => {
  const rules = new CheckingAccountRules();

  it('should return a transaction fee of 100 cents (R$ 1.00)', () => {
    expect(rules.calculateFee()).toBe(100);
  });

  it('should allow withdrawal that leaves balance at exactly -R$ 500.00 (-50000 cents)', () => {
    // 0 - 49900 (amount) - 100 (fee) = -50000 cents
    expect(() => rules.validateWithdraw(0, 49900, 100)).not.toThrow();
  });

  it('should fail withdrawal that leaves balance below -R$ 500.00 (-50001 cents)', () => {
    // 0 - 49901 (amount) - 100 (fee) = -50001 cents
    expect(() => rules.validateWithdraw(0, 49901, 100)).toThrow(
      InsufficientFundsException,
    );
  });
});

describe('SavingsAccountRules', () => {
  const rules = new SavingsAccountRules();

  it('should return a transaction fee of 0 cents (R$ 0.00)', () => {
    expect(rules.calculateFee()).toBe(0);
  });

  it('should allow withdrawal that leaves balance at exactly R$ 0.00 (0 cents)', () => {
    // 5000 - 5000 (amount) - 0 (fee) = 0 cents
    expect(() => rules.validateWithdraw(5000, 5000, 0)).not.toThrow();
  });

  it('should fail withdrawal that leaves balance below R$ 0.00 (-1 cents)', () => {
    // 5000 - 5001 (amount) - 0 (fee) = -1 cents
    expect(() => rules.validateWithdraw(5000, 5001, 0)).toThrow(
      InsufficientFundsException,
    );
  });
});

describe('AccountRulesFactory', () => {
  const factory = new AccountRulesFactory();

  it('should return CheckingAccountRules for CHECKING account type', () => {
    const rules = factory.getRules(AccountType.CHECKING);
    expect(rules).toBeInstanceOf(CheckingAccountRules);
  });

  it('should return SavingsAccountRules for SAVINGS account type', () => {
    const rules = factory.getRules(AccountType.SAVINGS);
    expect(rules).toBeInstanceOf(SavingsAccountRules);
  });

  it('should throw InvalidAccountException for unsupported account types', () => {
    expect(() => factory.getRules('INVALID' as any)).toThrow(
      InvalidAccountException,
    );
  });
});
