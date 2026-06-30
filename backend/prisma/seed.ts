import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  AccountType,
  TransactionType,
} from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with Users, Accounts and Transactions...');

  // Clean existing records in correct order of dependency
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const userJohn = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: 'hashed_password_123', // Dummy hashed password
    },
  });

  const userJane = await prisma.user.create({
    data: {
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      password: 'hashed_password_456',
    },
  });

  const userBob = await prisma.user.create({
    data: {
      email: 'bob.smith@example.com',
      name: 'Bob Smith',
      password: 'hashed_password_789',
    },
  });

  // 2. Create Accounts associated with users
  // John starts with R$ 500.00 (50000 cents) final balance.
  // We'll simulate a previous withdrawal of R$ 50.00 + R$ 1.00 fee from an initial R$ 551.00.
  const accountJohn = await prisma.account.create({
    data: {
      userId: userJohn.id,
      holder: 'John Doe Checking',
      type: AccountType.CHECKING,
      balanceInCents: 50000,
    },
  });

  // Jane starts with R$ 1,500.00 (150000 cents) final balance.
  // We'll simulate a transfer of R$ 200.00 (0 fee for savings) sent to Bob, starting from R$ 1,700.00.
  const accountJane = await prisma.account.create({
    data: {
      userId: userJane.id,
      holder: 'Jane Doe Savings',
      type: AccountType.SAVINGS,
      balanceInCents: 150000,
    },
  });

  // Bob starts with R$ 0.00 final balance.
  // We'll simulate:
  // 1. Receives R$ 200.00 from Jane (balance becomes R$ 200.00).
  // 2. Withdraws R$ 199.00 + R$ 1.00 fee (balance becomes R$ 0.00).
  const accountBob = await prisma.account.create({
    data: {
      userId: userBob.id,
      holder: 'Bob Smith Checking',
      type: AccountType.CHECKING,
      balanceInCents: 0,
    },
  });

  // 3. Create Seed Transactions to populate account statements

  // John's withdrawal
  await prisma.transaction.create({
    data: {
      accountId: accountJohn.id,
      type: TransactionType.WITHDRAWAL,
      amountInCents: 5000, // R$ 50.00
      feeInCents: 100, // R$ 1.00 Checking fee
      balanceAfter: 50000,
    },
  });

  // Jane's transfer to Bob
  await prisma.transaction.create({
    data: {
      accountId: accountJane.id,
      type: TransactionType.TRANSFER_SENT,
      amountInCents: 20000, // R$ 200.00
      feeInCents: 0, // R$ 0.00 Savings fee
      balanceAfter: 150000,
      relatedAccountId: accountBob.id,
    },
  });

  // Bob receives transfer from Jane
  await prisma.transaction.create({
    data: {
      accountId: accountBob.id,
      type: TransactionType.TRANSFER_RECEIVED,
      amountInCents: 20000, // R$ 200.00
      feeInCents: 0, // No fee for receiving
      balanceAfter: 20000,
      relatedAccountId: accountJane.id,
    },
  });

  // Bob's withdrawal
  await prisma.transaction.create({
    data: {
      accountId: accountBob.id,
      type: TransactionType.WITHDRAWAL,
      amountInCents: 19900, // R$ 199.00
      feeInCents: 100, // R$ 1.00 Checking fee
      balanceAfter: 0,
    },
  });

  console.log('Database seeded successfully.');
  console.log('Created Users:', { userJohn, userJane, userBob });
  console.log('Created Accounts:', { accountJohn, accountJane, accountBob });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
