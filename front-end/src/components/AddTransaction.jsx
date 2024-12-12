import React, { useState, useEffect } from 'react';
import './AddTransaction.css';
import axios from 'axios';
import CategoryDropdown from './categoryDropdown';

function AddTransaction({ onAddTransaction, onClose }) {
  const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;

  const [transaction, setTransaction] = useState({
    merchant: '',
    category: '',
    amount: '',
    date: '',
    accountId: '',
  });

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const userId = localStorage.getItem('id');
        const response = await axios.get(`${BASE_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAccounts(response.data);
        
        if (response.data.length > 0) {
          setTransaction(prev => ({
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
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async () => {
    const userId = localStorage.getItem('id');
    const { merchant, category, amount, date, accountId } = transaction;

    if (merchant && category && amount && date && accountId) {
      try {
        const inputDate = new Date(date);
        inputDate.setMinutes(inputDate.getMinutes() + inputDate.getTimezoneOffset());
        
        const response = await axios.post(`${BASE_URL}/api/transactions`, {
          merchant,
          category,
          amount: parseFloat(amount),
          date: inputDate.toISOString().split('T')[0],
          accountId,
          userId,
        });

        onAddTransaction(response.data);

        setTransaction({
          merchant: '',
          category: '',
          amount: '',
          date: '',
          accountId: accounts.length > 0 ? accounts[0]._id : '',
        });
        onClose();
      } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction. Please try again.');
      }
    } else {
      alert('Please fill in all fields before submitting.');
    }
  };
  

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add New Transaction</h2>
        <label>
          Merchant:
          <input
            type="text"
            name="merchant"
            value={transaction.merchant}
            onChange={(e) => handleInputChange('merchant', e.target.value)}
          />
        </label>
        <label>
          Category:
          <CategoryDropdown
            selectedCategory={transaction.category}
            onChange={(value) => handleInputChange('category', value)}
            allowCustom={true}
          />
        </label>
        <label>
          Amount:
          <input
            type="number"
            name="amount"
            value={transaction.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
          />
        </label>
        <label>
          Account:
          <select
            value={transaction.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
          >
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
            value={transaction.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </label>
        <button className="button" onClick={handleAddTransaction}>
          Add
        </button>
        <button className="button cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddTransaction;