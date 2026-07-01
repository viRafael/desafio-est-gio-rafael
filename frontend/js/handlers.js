import * as api from './api.js';
import * as render from './render.js';

let activeAccountId = null;
let accountsCache = [];

export function getActiveAccountId() {
  return activeAccountId;
}

export function setActiveAccountId(id) {
  activeAccountId = id;
}

export async function handleSelectAccount(accountId) {
  activeAccountId = accountId;

  // Update active states in account list cards
  const cards = document.querySelectorAll('.account-card');
  cards.forEach((card) => {
    if (card.getAttribute('data-id') === accountId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Find account in cache to render active account header
  const account = accountsCache.find((acc) => acc.id === accountId);
  const activeHeaderEl = document.querySelector('#active-account-info');
  const withdrawBtn = document.querySelector('#withdraw-form-btn');
  const transferBtn = document.querySelector('#transfer-form-btn');

  if (account) {
    render.renderActiveAccount(account, activeHeaderEl);

    if (withdrawBtn) withdrawBtn.removeAttribute('disabled');
    if (transferBtn) transferBtn.removeAttribute('disabled');
  } else {
    render.clearActiveAccount(activeHeaderEl);
    if (withdrawBtn) withdrawBtn.setAttribute('disabled', 'true');
    if (transferBtn) transferBtn.setAttribute('disabled', 'true');
  }

  // Load statement
  const msgArea = document.querySelector('#message-area');
  const statementListEl = document.querySelector('#statement-list');
  try {
    const statementData = await api.getStatement(accountId);
    render.renderStatement(statementData, statementListEl);
  } catch (err) {
    render.showMessage(err.message, 'error', msgArea);
  }

  // Re-populate transfer select to update destinations (cannot transfer to self)
  populateDestinations();
}

export async function handleWithdrawSubmit(event) {
  event.preventDefault();
  const msgArea = document.querySelector('#message-area');
  render.showMessage('', 'success', msgArea); // clear messages

  if (!activeAccountId) {
    render.showMessage('Please select an active account first.', 'error', msgArea);
    return;
  }

  const amountInput = document.querySelector('#withdraw-amount');
  const amount = amountInput.value;

  if (!amount || Number(amount) <= 0) {
    render.showMessage('Please enter a valid amount greater than zero.', 'error', msgArea);
    return;
  }

  try {
    await api.withdraw(activeAccountId, amount);
    render.showMessage('Withdrawal processed successfully!', 'success', msgArea);
    amountInput.value = '';

    // Reload data
    await reloadData();
  } catch (err) {
    render.showMessage(err.message, 'error', msgArea);
  }
}

export async function handleTransferSubmit(event) {
  event.preventDefault();
  const msgArea = document.querySelector('#message-area');
  render.showMessage('', 'success', msgArea); // clear messages

  if (!activeAccountId) {
    render.showMessage('Please select an active account first.', 'error', msgArea);
    return;
  }

  const destSelect = document.querySelector('#transfer-destination');
  const destAccountId = destSelect.value;
  const amountInput = document.querySelector('#transfer-amount');
  const amount = amountInput.value;

  if (!destAccountId) {
    render.showMessage('Please select a destination account.', 'error', msgArea);
    return;
  }

  if (destAccountId === activeAccountId) {
    render.showMessage('Cannot transfer to the same account.', 'error', msgArea);
    return;
  }

  if (!amount || Number(amount) <= 0) {
    render.showMessage('Please enter a valid amount greater than zero.', 'error', msgArea);
    return;
  }

  try {
    await api.transfer(activeAccountId, destAccountId, amount);
    render.showMessage('Transfer processed successfully!', 'success', msgArea);
    amountInput.value = '';

    // Reload data
    await reloadData();
  } catch (err) {
    render.showMessage(err.message, 'error', msgArea);
  }
}

export async function handleCreateAccountSubmit(event) {
  event.preventDefault();
  const msgArea = document.querySelector('#message-area');
  render.showMessage('', 'success', msgArea);

  const holderInput = document.querySelector('#create-holder');
  const typeSelect = document.querySelector('#create-type');
  const initialBalanceInput = document.querySelector('#create-initial-balance');

  const holder = holderInput.value.trim();
  const type = typeSelect.value;
  const initialBalance = initialBalanceInput.value;

  if (!holder) {
    render.showMessage('Please enter a holder name.', 'error', msgArea);
    return;
  }

  if (!type) {
    render.showMessage('Please select an account type.', 'error', msgArea);
    return;
  }

  if (initialBalance === '' || Number(initialBalance) < 0) {
    render.showMessage('Initial balance cannot be negative.', 'error', msgArea);
    return;
  }

  try {
    await api.createAccount(holder, type, initialBalance);

    render.showMessage(`Account for "${holder}" created successfully!`, 'success', msgArea);
    holderInput.value = '';
    initialBalanceInput.value = '0';

    // Reload accounts
    await reloadData();
  } catch (err) {
    render.showMessage(err.message, 'error', msgArea);
  }
}

function populateDestinations() {
  const destSelect = document.querySelector('#transfer-destination');
  if (!destSelect) return;

  const previousDestSelection = destSelect.value;
  destSelect.innerHTML = '<option value="" disabled selected>Select destination account...</option>';

  accountsCache.forEach((acc) => {
    if (acc.id !== activeAccountId) {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.innerText = `${acc.holder} (${acc.type === 'CHECKING' ? 'Checking' : 'Savings'} - Bal: ${render.formatCurrency(acc.balance)})`;
      destSelect.appendChild(opt);
    }
  });

  if (previousDestSelection && previousDestSelection !== activeAccountId) {
    destSelect.value = previousDestSelection;
  }
}

export async function reloadData() {
  const accountsListEl = document.querySelector('#accounts-list');
  const msgArea = document.querySelector('#message-area');

  try {
    accountsCache = await api.getAccounts();
    render.renderAccounts(accountsCache, accountsListEl, activeAccountId, handleSelectAccount);

    // Populate transfer destinations
    populateDestinations();

    // Refresh active account header and statement if one is selected
    if (activeAccountId) {
      const activeAccount = accountsCache.find((acc) => acc.id === activeAccountId);
      if (activeAccount) {
        const activeHeaderEl = document.querySelector('#active-account-info');
        render.renderActiveAccount(activeAccount, activeHeaderEl);

        // Refresh statement
        const statementListEl = document.querySelector('#statement-list');
        const statementData = await api.getStatement(activeAccountId);
        render.renderStatement(statementData, statementListEl);
      } else {
        // Active account was deleted
        activeAccountId = null;
        render.clearActiveAccount(document.querySelector('#active-account-info'));
        render.clearStatement(document.querySelector('#statement-list'));
        const withdrawBtn = document.querySelector('#withdraw-form-btn');
        const transferBtn = document.querySelector('#transfer-form-btn');
        if (withdrawBtn) withdrawBtn.setAttribute('disabled', 'true');
        if (transferBtn) transferBtn.setAttribute('disabled', 'true');
      }
    }
  } catch (err) {
    render.showMessage(err.message, 'error', msgArea);
  }
}
