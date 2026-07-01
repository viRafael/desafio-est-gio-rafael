export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function renderAccounts(accounts, containerEl, activeAccountId, onSelect) {
  containerEl.innerHTML = '';

  if (accounts.length === 0) {
    containerEl.innerHTML = '<p class="empty-state">No accounts found. Create one below!</p>';
    return;
  }

  accounts.forEach((account) => {
    const card = document.createElement('div');
    const isActive = account.id === activeAccountId;
    card.className = `account-card ${isActive ? 'active' : ''}`;
    card.setAttribute('data-id', account.id);

    card.innerHTML = `
      <div class="card-badge-row">
        <span class="badge ${account.type.toLowerCase()}">
          ${account.type === 'CHECKING' ? 'Checking' : 'Savings'}
        </span>
      </div>
      <h3 class="card-holder">${account.holder}</h3>
      <p class="card-balance">${formatCurrency(account.balance)}</p>
    `;

    card.addEventListener('click', () => onSelect(account.id));
    containerEl.appendChild(card);
  });
}

export function renderStatement(statementData, containerEl) {
  containerEl.innerHTML = '';
  const transactions = statementData.transactions || [];

  if (transactions.length === 0) {
    containerEl.innerHTML = '<p class="empty-state">No transactions recorded yet.</p>';
    return;
  }

  const list = document.createElement('div');
  list.className = 'statement-list-container';

  transactions.forEach((tx) => {
    const item = document.createElement('div');

    let sign = '-';
    let typeClass = 'negative';
    let typeLabel = 'Withdraw';
    let detailsText = '';

    if (tx.type === 'WITHDRAWAL') {
      typeLabel = 'Withdrawal';
      typeClass = 'withdrawal-type';
    } else if (tx.type === 'TRANSFER_SENT') {
      typeLabel = 'Transfer Sent';
      typeClass = 'transfer-sent-type';
      detailsText = tx.relatedAccount ? `to ${tx.relatedAccount.holder}` : '';
    } else if (tx.type === 'TRANSFER_RECEIVED') {
      sign = '+';
      typeClass = 'transfer-received-type';
      typeLabel = 'Transfer Received';
      detailsText = tx.relatedAccount ? `from ${tx.relatedAccount.holder}` : '';
    }

    const formattedDate = new Date(tx.createdAt).toLocaleString('pt-BR');
    const feeText = tx.fee > 0 ? ` (Fee: ${formatCurrency(tx.fee)})` : '';

    item.className = `statement-item ${typeClass}`;
    item.innerHTML = `
      <div class="item-info">
        <span class="item-label">${typeLabel} ${detailsText}</span>
        <span class="item-date">${formattedDate}</span>
      </div>
      <div class="item-values">
        <span class="item-amount">${sign} ${formatCurrency(tx.amount)}</span>
        <span class="item-fee">${feeText}</span>
        <span class="item-balance">After: ${formatCurrency(tx.balanceAfter)}</span>
      </div>
    `;
    list.appendChild(item);
  });

  containerEl.appendChild(list);
}

export function showMessage(text, type, containerEl) {
  containerEl.innerHTML = '';
  if (!text) return;

  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerText = text;
  containerEl.appendChild(msg);
}

export function renderActiveAccount(account, containerEl) {
  if (!account) {
    containerEl.innerHTML = '<p class="empty-state">No account selected.</p>';
    return;
  }

  containerEl.innerHTML = `
    <div class="active-info-block">
      <span class="active-label">Active Account</span>
      <h2 class="active-holder">${account.holder}</h2>
      <p class="active-balance">
        ${formatCurrency(account.balance)}
        <span class="active-type-badge ${account.type.toLowerCase()}">
          ${account.type === 'CHECKING' ? 'Checking' : 'Savings'}
        </span>
      </p>
    </div>
  `;
}

export function clearActiveAccount(containerEl) {
  containerEl.innerHTML = '<p class="empty-state">No account selected.</p>';
}

export function clearStatement(containerEl) {
  containerEl.innerHTML = '<p class="empty-state">No transactions recorded yet.</p>';
}
