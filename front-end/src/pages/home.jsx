import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import CategoricalLimits from '../components/CategoricalLimits.jsx';
import Notifications from '../components/notifications.jsx';
import AddTransaction from '../components/AddTransaction';
import SetBudget from '../components/SetBudget';
import EditBudget from '../components/EditBudget'; 
import './home.css';
import { Link } from 'react-router-dom';

function Home() {
    const [transactions, setTransactions] = useState([]);
    const [categoryLimits, setCategoryLimits] = useState({});
    const [totalSpent, setTotalSpent] = useState(0);
    const [monthlyLimit, setMonthlyLimit] = useState(0);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showSetBudget, setShowSetBudget] = useState(false);
    const [showEditBudget, setShowEditBudget] = useState(false); 

    const userId = localStorage.getItem('id');

    useEffect(() => {
        if (!userId) {
            console.error('No logged-in user found');
            return;
        }
        fetch(`http://localhost:3001/api/transactions?userId=${userId}`)
            .then((response) => response.json())
            .then((data) => {
                const sortedTransactions = (data || []).sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
                setTransactions(sortedTransactions);

                const spent = sortedTransactions.reduce(
                    (total, transaction) => total + transaction.amount,
                    0
                );
                setTotalSpent(spent);
            })
            .catch((err) => console.error('Error fetching transactions:', err));

        fetch(`http://localhost:3001/api/budget-limits?userId=${userId}`)
            .then((response) => response.json())
            .then((data) => {
                setMonthlyLimit(data.monthlyLimit || 0);
                const limits = (data.categories || []).reduce((acc, category) => {
                    acc[category.name] = category.limit;
                    return acc;
                }, {});
                setCategoryLimits(limits);
            })
            .catch((err) => console.error('Error fetching budget limits:', err));
    }, [userId]);

    const handleBudgetSet = (updatedBudget) => {
      if (updatedBudget) {
        setMonthlyLimit(updatedBudget.monthlyLimit);
        const newCategoryLimits = updatedBudget.categories.reduce((acc, category) => {
            acc[category.name] = category.limit;
            return acc;
        }, {});
        setCategoryLimits(newCategoryLimits);
      }
      setShowSetBudget(false);
      setShowEditBudget(false);
    };

    return (
        <div className="home-container">
            {/* Updated Header */}
            <Header />

            {/* Budget Overview Section */}
            <section className="budget-overview">
                <div className="budget-header">
                    <h2>Monthly Spending Progress</h2>
                </div>

                {monthlyLimit === 0 ? (
                    <div className="set-budget-container">
                        <p>Budget Limits Not Set</p>
                        <button onClick={() => setShowSetBudget(true)}>Create Budget</button>
                    </div>
                ) : (
                    <>
                        <p>
                            <strong>Total Budget:</strong> ${totalSpent} / ${monthlyLimit}
                        </p>

                        <div className="progress-bar-container">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${Math.min((totalSpent / monthlyLimit) * 100, 100)}%`,
                                }}
                            >
                                {Math.round((totalSpent / monthlyLimit) * 100)}% Spent
                            </div>
                        </div>

                        <button
                            className="view-breakdown"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                        >
                            {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
                        </button>

                        {showBreakdown && (
                            <>
                                <CategoricalLimits
                                    categoryTotals={transactions.reduce((totals, transaction) => {
                                        const { category, amount } = transaction;
                                        totals[category] =
                                            (totals[category] || 0) + amount;
                                        return totals;
                                    }, {})}
                                    isEditing={isEditing}
                                    handleLimitChange={(category, value) => {
                                        setCategoryLimits((prev) => ({
                                            ...prev,
                                            [category]: value,
                                        }));
                                    }}
                                />
                                <button
                                    className="edit-button"
                                    onClick={() => setShowEditBudget(true)}
                                >
                                    Edit
                                </button>
                            </>
                        )}
                    </>
                )}
            </section>

            {/* Notifications */}
            <Notifications 
                categoryLimits={categoryLimits} 
                transactions={transactions} 
            />

            {/* Transactions Section */}
            <section className="transactions">
                <div className="transactions-header">
                    <Link to="/transactions" className="transactions-link">
                        <h2>Transactions</h2>
                    </Link>
                    <button
                        id="add-transaction-button"
                        onClick={() => setShowAddTransaction(true)}
                    >
                        +
                    </button>
                </div>
                <ul className="transaction-list">
                  {transactions.slice(0, 5).map((transaction) => (
                      <li key={transaction._id || transaction.id} className="transaction-item">
                          <span>{transaction.merchant || 'Unknown Merchant'}</span>
                          <span>{transaction.category || 'Uncategorized'}</span>
                          <span>
                              $
                              {transaction.amount !== undefined && transaction.amount !== null
                                  ? transaction.amount.toFixed(2)
                                  : '0.00'}
                          </span>
                          <span>
                              {transaction.date
                                  ? new Date(transaction.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                  : 'No Date'}
                          </span>
                      </li>
                  ))}
              </ul>
            </section>

            {showAddTransaction && (
              <AddTransaction
                  onAddTransaction={(transaction) => {
                      fetch(`http://localhost:3001/api/transactions?userId=${userId}`)
                          .then((response) => response.json())
                          .then((data) => {
                              const sortedTransactions = (data || []).sort(
                                  (a, b) => new Date(b.date) - new Date(a.date)
                              );
                              setTransactions(sortedTransactions);
                              const spent = sortedTransactions.reduce(
                                  (total, transaction) => total + transaction.amount,
                                  0
                              );
                              setTotalSpent(spent);
                          })
                          .catch((err) => console.error('Error fetching transactions:', err));
                  }}
                  onClose={() => setShowAddTransaction(false)}
              />
          )}


            {showSetBudget && (
                <SetBudget
                    onSetBudget={handleBudgetSet}
                    onClose={() => setShowSetBudget(false)}
                />
            )}

            {showEditBudget && (
                <EditBudget
                    currentBudget={{
                        monthlyLimit,
                        categories: Object.keys(categoryLimits).map(name => ({
                            name,
                            limit: categoryLimits[name],
                        })),
                    }}
                    onUpdateBudget={handleBudgetSet}
                    onClose={() => setShowEditBudget(false)}
                />
            )}
        </div>
    );
}

export default Home;
