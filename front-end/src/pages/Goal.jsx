import React, { useEffect, useState } from 'react';
import './Goal.css';
import GoalForm from './GoalForm';

const Goal = ({ currentUserId }) => {
    const [goals, setGoals] = useState([]);
    const [currentGoal, setCurrentGoal] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [linkedTransactions, setLinkedTransactions] = useState({});
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);

    // Fetch goals with linked transactions
    const fetchGoals = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('id');

            if (!token || !userId) {
                throw new Error('User not authenticated.');
            }

            const goalsResponse = await fetch(`http://localhost:3001/goals?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const goalsData = await goalsResponse.json();
            setGoals(goalsData);

            // Fetch linked transactions for each goal
            const linkedTransactionsData = {};
            await Promise.all(
                goalsData.map(async (goal) => {
                    const response = await fetch(
                        `http://localhost:3001/goals/${goal._id}/transactions?userId=${userId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        linkedTransactionsData[goal._id] = data;
                    }
                })
            );
            setLinkedTransactions(linkedTransactionsData);
        } catch (error) {
            console.error('Error fetching goals and transactions:', error);
        }
    };

    // Fetch all transactions
    const fetchTransactions = async () => {
        try {
            const userId = localStorage.getItem('id');
            const response = await fetch(`http://localhost:3001/api/transactions?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            await fetchGoals();
            await fetchTransactions();
        };
        fetchData();
    }, []);

    // Handle link transaction
    const handleLinkTransaction = async (transactionId, amount) => {
        const userId = localStorage.getItem('id');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:3001/goals/${selectedGoalId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    transactionId,
                    amount: parseFloat(amount)
                }),
            });

            if (!response.ok) throw new Error('Failed to link transaction');

            // Refresh data
            await fetchGoals();

            setShowTransactionModal(false);
            setSelectedGoalId(null);
        } catch (error) {
            console.error('Error linking transaction:', error);
        }
    };

    // Handle unlink transaction with proper state updates
    const handleUnlinkTransaction = async (transactionId) => {
        const userId = localStorage.getItem('id');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(
                `http://localhost:3001/goals/${selectedGoalId}/unlink/${transactionId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId,
                        goalId: selectedGoalId
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to unlink transaction');
            }

            // Update local state immediately
            setLinkedTransactions(prev => ({
                ...prev,
                [selectedGoalId]: prev[selectedGoalId].filter(
                    t => t.transactionId !== transactionId
                )
            }));

            // Refresh goal data to get updated amounts
            await fetchGoals();

            setShowUnlinkModal(false);
        } catch (error) {
            console.error('Error unlinking transaction:', error);
            alert('Failed to unlink transaction: ' + error.message);
        }
    };

    // Handle adding or editing goals
    const handleAddOrEditGoal = async (goal) => {
        const userId = localStorage.getItem('id');
        const token = localStorage.getItem('token');

        const newGoal = {
            name: goal.goalName,
            targetAmount: parseFloat(goal.spendingDetails),
            frequency: goal.spending,
            userId,
            currentAmount: currentGoal ? currentGoal.currentAmount : 0,
        };

        try {
            if (currentGoal) {
                const response = await fetch(`http://localhost:3001/goals/${currentGoal._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(newGoal),
                });
                if (!response.ok) throw new Error('Failed to update goal');
            } else {
                const response = await fetch('http://localhost:3001/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(newGoal),
                });
                if (!response.ok) throw new Error('Failed to create goal');
            }

            // Refresh goals list
            await fetchGoals();

            setShowEditModal(false);
            setCurrentGoal(null);
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    };

    // Handle goal deletion
    const handleDeleteGoal = async (goalId) => {
        const userId = localStorage.getItem('id');
        const token = localStorage.getItem('token');

        if (!userId) {
            console.error('User ID is missing');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/goals/${goalId}?userId=${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to delete goal');
            setGoals(goals.filter((goal) => goal._id !== goalId));
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    return (
        <main className="Goal">
            <h1>Goals</h1>
            <div className="grid-container">
                {/* Create Goals Section */}
                <div className="grid-item3">
                    <h2>Create New Goal</h2>
                    <GoalForm onSubmit={handleAddOrEditGoal} />
                </div>

                {/* Goals List Section */}
                <div className="goals-list">
                    <h2>Your Goals</h2>
                    {goals.length > 0 ? (
                        goals.map((goal) => (
                            <div key={goal._id} className="goal-item">
                                <h3>{goal.name}</h3>
                                <p>Target: ${goal.targetAmount}</p>
                                <p>Current: ${goal.currentAmount}</p>
                                <div className="progress-bar-container">
    <div
        className="progress-bar"
        style={{
            width: goal.currentAmount > 0 ? `${(goal.currentAmount / goal.targetAmount) * 100}%` : '0%',
            backgroundColor: goal.currentAmount > 0 ? '#4CAF50' : 'transparent'
        }}
    >
        <span className="progress-text" style={{
            color: goal.currentAmount > 0 ? 'white' : 'black'
        }}>
            {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% Achieved
        </span>
    </div>
</div>
                                <div className="button-group">
                                    <button
                                        className="edit-button"
                                        onClick={() => {
                                            setCurrentGoal(goal);
                                            setShowEditModal(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDeleteGoal(goal._id)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="link-button"
                                        onClick={() => {
                                            setSelectedGoalId(goal._id);
                                            setShowTransactionModal(true);
                                        }}
                                    >
                                        Link Transaction
                                    </button>
                                    <button
                                        className="unlink-button"
                                        onClick={() => {
                                            setSelectedGoalId(goal._id);
                                            setShowUnlinkModal(true);
                                        }}
                                        disabled={!linkedTransactions[goal._id]?.length}
                                    >
                                        Unlink Transaction
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No goals added yet.</p>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit Goal</h2>
                            <button
                                className="modal-close-button"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setCurrentGoal(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        {currentGoal && (
                            <GoalForm
                                initialData={{
                                    goalName: currentGoal.name,
                                    spending: currentGoal.frequency,
                                    spendingDetails: currentGoal.targetAmount.toString()
                                }}
                                onSubmit={handleAddOrEditGoal}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Transaction Linking Modal */}
            {showTransactionModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Link Transaction to Goal</h2>
                            <button
                                className="modal-close-button"
                                onClick={() => {
                                    setShowTransactionModal(false);
                                    setSelectedGoalId(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="transaction-list">
                            {transactions
                                .filter(transaction => {
                                    // Check if this transaction is already linked to any goal
                                    return !Object.values(linkedTransactions).flat()
                                        .some(linked => linked.transactionId === transaction._id);
                                })
                                .map(transaction => (
                                    <div key={transaction._id} className="transaction-item">
                                        <p>{transaction.merchant} - ${transaction.amount}</p>
                                        <p className="transaction-date">
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </p>
                                        <button
                                            onClick={() => handleLinkTransaction(transaction._id, transaction.amount)}
                                            className="link-transaction-button"
                                        >
                                            Link to Goal
                                        </button>
                                    </div>
                                ))}
                            {transactions.length === 0 && <p>No unlinked transactions available.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Unlink Modal */}
            {showUnlinkModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Unlink Transaction from Goal</h2>
                            <button
                                className="modal-close-button"
                                onClick={() => {
                                    setShowUnlinkModal(false);
                                    setSelectedGoalId(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="transaction-list">
                            {linkedTransactions[selectedGoalId]?.map(transaction => (
                                <div key={transaction.transactionId} className="transaction-item">
                                    <p>{transaction.merchant} - ${transaction.amount}</p>
                                    <p className="transaction-date">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={() => handleUnlinkTransaction(transaction.transactionId)}
                                        className="unlink-transaction-button"
                                    >
                                        Unlink from Goal
                                    </button>
                                </div>
                            ))}
                            {(!linkedTransactions[selectedGoalId] || linkedTransactions[selectedGoalId].length === 0) &&
                                <p>No linked transactions for this goal.</p>
                            }
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Goal;