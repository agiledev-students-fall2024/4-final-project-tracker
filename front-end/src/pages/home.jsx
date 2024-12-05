import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import BudgetProgress from '../mocks/BudgetProgress.jsx';
import Notifications from '../components/notifications.jsx';
import transactionData from '../mocks/transactionData';
import budgetLimits from '../mocks/budgetLimits';
import Categories from '../components/Categories.jsx';
import AddTransaction from '../components/AddTransaction';
import './home.css';
import { Link } from 'react-router-dom';

function Home() {
  const { overall } = BudgetProgress();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  
  const userId = 1; // Replace with the actual user ID
  const budgetId = 1; // Replace with the actual budget ID
  
  const totalSpent = overall.totalSpent || 0;

  useEffect(() => {
    // Fetch transactions for the user
    fetch(`http://localhost:3001/api/transactions?userId=${userId}&budgetId=${budgetId}`)
      .then(response => response.json())
      .then(data => setTransactions(data))
      .catch(err => console.error("Error fetching transactions:", err));

    // Fetch budget limits
    fetch(`http://localhost:3001/api/budget-limits?userId=${userId}&budgetId=${budgetId}`)
      .then(response => response.json())
      .then(data => {
        setCategoryLimits(data.categoryLimits || {}); // Set category limits
        setTotalBudget(data.monthlyLimit || 0);       // Set total budget from monthlyLimit
      })
      .catch(err => console.error("Error fetching budget limits:", err));
  }, []);

  // Calculate category totals based on transactions
  const categoryTotals = transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;
    if (categoryLimits[category]) {
      acc[category] = (acc[category] || 0) + amount;
    } else {
      acc['Other'] = (acc['Other'] || 0) + amount;
    }
    return acc;
  }, {});

  const handleAddTransaction = (transaction) => {
    setTransactions([transaction, ...transactions]);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleLimitChange = (category, value) => {
    setCategoryLimits((prevLimits) => ({
      ...prevLimits,
      [category]: value,
    }));
  };  

  const saveBudgetLimits = () => {
    setIsEditing(false);
  };

  return (
    <div className="home-container">
      <Header />

      <section className="budget-overview">
        <div className="budget-header">
          <h2>Monthly Spending Progress</h2>
          {showBreakdown && (
            <button className="edit-button" onClick={isEditing ? saveBudgetLimits : toggleEdit}>
              {isEditing ? 'Save' : 'Edit'}
            </button>
          )}
        </div>

        <p>
          <strong>Total Budget:</strong> 
          {isEditing ? (
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="total-budget-input"
            />
          ) : (
            ` $${totalSpent} / $${totalBudget}`
          )}
        </p>
        
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}>
            {Math.round((totalSpent / totalBudget) * 100)}% Spent
          </div>
        </div>

        <button className="view-breakdown" onClick={() => setShowBreakdown(!showBreakdown)}>
          {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
        </button>

        {showBreakdown && (
          <Categories
            categoryTotals={categoryTotals}
            categoryLimits={categoryLimits}
            isEditing={isEditing}
            handleLimitChange={handleLimitChange}
          />
        )}
      </section>

      <Notifications />

      <section className="transactions">
        <div className="transactions-header">
          <Link to="/transactions" className="transactions-link">
            <h2>Transactions</h2>
          </Link>
          <button id="add-transaction-button" onClick={() => setShowAddTransaction(true)}>
            +
          </button>
        </div>
        <ul className="transaction-list">
          <li className="transaction-item header">
            <span>Merchant</span>
            <span>Category</span>
            <span>Amount</span>
            <span>Date</span>
          </li>
          {transactions.slice(0, 5).map((transaction) => (
            <li key={transaction.id} className="transaction-item">
              <span>{transaction.merchant}</span>
              <span>{transaction.category}</span>
              <span>${transaction.amount.toFixed(2)}</span>
              <span>{transaction.date}</span>
            </li>
          ))}
        </ul>
      </section>

      {showAddTransaction && (
        <AddTransaction 
          onAddTransaction={handleAddTransaction} 
          onClose={() => setShowAddTransaction(false)} 
        />
      )}
    </div>
  );
}

export default Home;
