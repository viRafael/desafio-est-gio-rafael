export class DomainException extends Error {
  constructor(
    public override readonly message: string,
    public readonly errorName: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
