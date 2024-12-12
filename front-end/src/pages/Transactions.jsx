import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditTransaction from '../components/EditTransaction';
import AddTransaction from '../components/AddTransaction';
import './Transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editTransaction, setEditTransaction] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem('id');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:3001/api/transactions?userId=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sortedData);
        setFilteredTransactions(sortedData);

        const uniqueCategories = ['All', ...new Set(sortedData.map((t) => t.category))];
        setCategories(uniqueCategories);
      })
      .catch((err) => console.error('Error fetching transactions:', err));

    fetch(`http://localhost:3001/api/accounts?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((accountsData) => {
        setAccounts(accountsData);
      })
      .catch((err) => console.error('Error fetching accounts:', err));
    
    
  }, [userId]);

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCategory(category);

    if (category === 'All') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.category === category));
    }
  };

  const handleTransactionClick = (transaction) => setEditTransaction(transaction);

  const handleNewTransaction = (transactionData) => {
    const { transaction: newTransaction, updatedAccount } = transactionData;
    const updatedTransactions = [newTransaction, ...transactions];
    const sortedTransactions = updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(sortedTransactions);
    setFilteredTransactions(sortedTransactions);
  
    setAccounts((prevAccounts) => {
      const updatedAccountIndex = prevAccounts.findIndex((account) => account.number === updatedAccount.number);
      
      return [
        ...prevAccounts.slice(0, updatedAccountIndex),
        updatedAccount,
        ...prevAccounts.slice(updatedAccountIndex + 1),
      ];
    });
  };
  
  const handleUpdateTransaction = (transactionData) => {
    const { transaction: updatedTransaction, updatedAccount } = transactionData;
  
    const updatedTransactions = transactions.map((transaction) =>
      transaction._id === updatedTransaction._id ? updatedTransaction : transaction
    );
    const sortedTransactions = updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(sortedTransactions);
  

    setFilteredTransactions(
      selectedCategory === 'All'
        ? sortedTransactions
        : sortedTransactions.filter((t) => t.category === selectedCategory)
    );
  
    if (updatedAccount) {
      setAccounts((prevAccounts) => {
        const updatedAccountIndex = prevAccounts.findIndex((account) => account.number === updatedAccount.number);
        if (updatedAccountIndex === -1) return prevAccounts; 
        
        return [
          ...prevAccounts.slice(0, updatedAccountIndex),
          updatedAccount,
          ...prevAccounts.slice(updatedAccountIndex + 1),
        ];
      });
    }
  };

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2>Transactions</h2>
        <button id="add-transaction-button" onClick={() => setShowAddTransaction(true)}>
          +
        </button>
      </div>

      {/* Existing render logic remains the same */}
      <div className="filter-section">
        <label htmlFor="categoryFilter">Filter by Category:</label>
        <select
          id="categoryFilter"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="category-filter"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="no-transactions-message">No transactions found.</p>
      ) : (
        <ul className="transaction-list1">
          {filteredTransactions.map((transaction) => (
            <li
              key={transaction._id}
              className="transaction-card"
              onClick={() => handleTransactionClick(transaction)}
            >
              <div className="card-header">
                <span className="merchant">{transaction.merchant}</span>
                <span className="amount">${transaction.amount.toFixed(2)}</span>
              </div>
              <div className="card-details">
                <span className="category">{transaction.category}</span>
                <span className="date">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editTransaction && (
        <EditTransaction
          transaction={editTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onClose={() => setEditTransaction(null)}
          onDeleteTransaction={(id) => {
            setTransactions(transactions.filter((t) => t._id !== id));
            setFilteredTransactions(filteredTransactions.filter((t) => t._id !== id));
          }}
        />
      )}

      {showAddTransaction && (
        <AddTransaction
          onAddTransaction={handleNewTransaction}
          onClose={() => setShowAddTransaction(false)}
        />
      )}
    </div>
  );
}

export default Transactions;