export interface AccountRules {
  calculateFee(): number;
  validateWithdraw(currentBalance: number, amount: number, fee: number): void;
}
