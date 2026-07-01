import {
  reloadData,
  handleWithdrawSubmit,
  handleTransferSubmit,
  handleCreateAccountSubmit,
} from './handlers.js';

async function init() {
  // Load initial data
  await reloadData();

  // Attach event listeners
  const withdrawForm = document.querySelector('#withdraw-form');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', handleWithdrawSubmit);
  }

  const transferForm = document.querySelector('#transfer-form');
  if (transferForm) {
    transferForm.addEventListener('submit', handleTransferSubmit);
  }

  const createAccountForm = document.querySelector('#create-account-form');
  if (createAccountForm) {
    createAccountForm.addEventListener('submit', handleCreateAccountSubmit);
  }
}

document.addEventListener('DOMContentLoaded', init);
