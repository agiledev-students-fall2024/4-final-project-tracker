import React, { useState, useEffect } from 'react';
import './EditTransaction.css';
import axios from 'axios';
import CategoryDropdown from './categoryDropdown';
import { FaTrash } from 'react-icons/fa';

function EditTransaction({ transaction, onUpdateTransaction, onClose, onDeleteTransaction }) {
  const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;
  const [accounts, setAccounts] = useState([]);
  const [originalAccount, setOriginalAccount] = useState(null);
  
  const [updatedTransaction, setUpdatedTransaction] = useState({
    ...transaction,
    _id: transaction._id,
    merchant: transaction.merchant || '',
    category: transaction.category || '',
    amount: transaction.amount.toString(),
    date: new Date(new Date(transaction.date).getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0],
    accountId: transaction.accountId || ''
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAccounts(response.data);

        const originalAcc = response.data.find(acc => acc._id === transaction.accountId);
        setOriginalAccount(originalAcc);

        if (!updatedTransaction.accountId && response.data.length > 0) {
          setUpdatedTransaction(prev => ({
            ...prev,
            accountId: response.data[0]._id
          }));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchAccounts();
  }, [BASE_URL]);

  const handleInputChange = (name, value) => {
    setUpdatedTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateAccountBalance = async (accountId, newAmount) => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const userId = localStorage.getItem('id');
    
    try {
      const response = await axios.put(
        `${BASE_URL}/api/accounts/${accountId}`,
        {
          userId,
          amount: newAmount
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  };

  const handleUpdateTransaction = async () => {
    const userId = localStorage.getItem('id');
    const { _id, merchant, category, amount, date, accountId } = updatedTransaction;
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
  
    if (!merchant?.trim()) return alert('Please enter a merchant name.');
    if (!category?.trim()) return alert('Please select a category.');
    if (!amount || amount <= 0) return alert('Please enter a valid amount.');
    if (!date?.trim()) return alert('Please select a date.');
    if (!accountId) return alert('Please select an account.');
  
    try {
      const inputDate = new Date(date);
      inputDate.setMinutes(inputDate.getMinutes() + inputDate.getTimezoneOffset());
  
      const response = await axios.put(
        `${BASE_URL}/api/transactions/${_id}`,
        {
          userId,
          merchant,
          category,
          amount: parseFloat(amount),
          date: inputDate.toISOString().split('T')[0],
          accountId,
        },
        { headers }
      );
  
      const { transaction, updatedAccounts } = response.data;
      const updatedTargetAccount = updatedAccounts.find(acc => acc._id === accountId);
      onUpdateTransaction({
        transaction,
        updatedAccount: updatedTargetAccount,
      });
  
      onClose();
    } catch (err) {
      console.error('Error updating transaction:', err.response?.data || err.message);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = async () => {
    const userId = localStorage.getItem('id');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    try {
      if (originalAccount) {
        const updatedBalance = originalAccount.amount + parseFloat(transaction.amount);
        await updateAccountBalance(originalAccount._id, updatedBalance);
      }
      
      await axios.delete(`${BASE_URL}/api/transactions/${transaction._id}`, {
        headers,
        data: { userId }
      });

      onDeleteTransaction(transaction._id);
      onClose();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <FaTrash
          className="trash-icon"
          onClick={handleDeleteTransaction}
          title="Delete Transaction"
        />
        <h2>Edit Transaction</h2>
        <label>
          Merchant:
          <input
            type="text"
            name="merchant"
            value={updatedTransaction.merchant}
            onChange={(e) => handleInputChange('merchant', e.target.value)}
          />
        </label>
        <label>
          Category:
          <CategoryDropdown
            selectedCategory={updatedTransaction.category}
            onChange={(value) => handleInputChange('category', value)}
            allowCustom={true}
          />
        </label>
        <label>
          Amount:
          <input
            type="number"
            name="amount"
            value={updatedTransaction.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
          />
        </label>
        <label>
          Account:
          <select
            name="accountId"
            value={updatedTransaction.accountId || ''}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.type} - {account.number}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={updatedTransaction.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </label>
        <button className="button" onClick={handleUpdateTransaction}>
          Save
        </button>
        <button className="button cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EditTransaction;