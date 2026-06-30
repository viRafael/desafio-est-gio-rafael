import { DomainException } from './domain.exception';

export class InsufficientFundsException extends DomainException {
  constructor(message = 'Insufficient funds for this operation.') {
    super(message, 'InsufficientFunds', 400);
  }
}
