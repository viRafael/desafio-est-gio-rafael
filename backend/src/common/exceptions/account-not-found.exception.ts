import { DomainException } from './domain.exception';

export class AccountNotFoundException extends DomainException {
  constructor(message = 'Account not found.') {
    super(message, 'AccountNotFound', 404);
  }
}
