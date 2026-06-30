import { DomainException } from './domain.exception';

export class InvalidAccountException extends DomainException {
  constructor(message = 'Invalid account.') {
    super(message, 'InvalidAccount', 400);
  }
}
