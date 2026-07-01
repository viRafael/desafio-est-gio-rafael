const BASE_URL = 'http://localhost:3033';

export async function getAccounts() {
  const res = await fetch(`${BASE_URL}/accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts list.');
  return res.json();
}

export async function withdraw(accountId, amount) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Number(amount) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to process withdrawal.');
  }
  return data;
}

export async function transfer(accountId, destinationAccountId, amount) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destinationAccountId,
      amount: Number(amount),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to process transfer.');
  }
  return data;
}

export async function getStatement(accountId) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/statement`);
  if (!res.ok) throw new Error('Failed to fetch account statement.');
  return res.json();
}

export async function createAccount(holder, type, initialBalance) {
  const res = await fetch(`${BASE_URL}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      holder,
      type,
      initialBalance: Number(initialBalance),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create account.');
  }
  return data;
}
