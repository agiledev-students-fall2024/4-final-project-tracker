import React, { useState, useEffect } from 'react';
import './RecurringPayments.css';
import axios from 'axios';
 
function RecurringPayments() {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('id');
  // Base URL from environment variable
  const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;
 
  const [newPayment, setNewPayment] = useState({
    userId: userId || '',
    accountId: '',
    name: '',
    category: '',
    amount: '',
    dueDate: '',
  });
 
  useEffect(() => {
    if (!token) {
      setError('User not authenticated.');
      return;
    }
 
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/recurringbills/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayments(response.data || []);
      } catch (error) {
        console.error('Failed to fetch recurring bills:', error);
        setError('Unable to fetch recurring payments.');
      }
    };
 
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(response.data || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setError('Unable to fetch bank accounts.');
      }
    };
 
    fetchPayments();
    fetchAccounts();
  }, [token]);
 
  const handleChange = (e) => {
    setNewPayment({ ...newPayment, [e.target.name]: e.target.value });
  };
 
  const resetForm = () => {
    setNewPayment({
      userId: userId || '',
      accountId: '',
      name: '',
      category: '',
      amount: '',
      dueDate: '',
    });
    setShowModal(false);
    setIsEditing(false);
    setCurrentPaymentIndex(null);
    setErrorMessage('');
  };
 
  const handleAddOrEditPayment = async () => {
    setMessage('');
    setErrorMessage('');
 
    try {
      if (!token) throw new Error('User not authenticated.');
      if (!newPayment.name || !newPayment.category || !newPayment.amount) {
        setErrorMessage('All fields are required.');
        return;
      }
 
      let response;
      if (isEditing && currentPaymentIndex !== null) {
        const updatedPayment = { ...newPayment };
        response = await axios.put(
          `${BASE_URL}/api/recurringbills/${updatedPayment._id}`,
          updatedPayment,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedPayments = [...payments];
        updatedPayments[currentPaymentIndex] = response.data;
        setPayments(updatedPayments);
      } else {
        response = await axios.post(
          `${BASE_URL}/api/recurringbills`,
          newPayment,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPayments([...payments, response.data]);
      }
 
      setMessage(response.data.message || 'Operation successful.');
      resetForm();
    } catch (error) {
      const errorResponse = error.response?.data;
      if (errorResponse?.errors) {
        const formattedErrors = errorResponse.errors
          .map((e) => e.msg)
          .join('\n');
        setErrorMessage(formattedErrors);
      } else {
        setErrorMessage('An unexpected error occurred.');
        console.error(
          `Failed to ${isEditing ? 'update' : 'add'} payment:`,
          error.response?.data || error.message
        );
      }
    }
  };
 
  const handleEdit = (index) => {
    setCurrentPaymentIndex(index);
    setNewPayment(payments[index]);
    setIsEditing(true);
    setShowModal(true);
  };
 
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/recurringbills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(payments.filter((payment) => payment._id !== id));
    } catch (error) {
      console.error('Failed to delete payment:', error);
      setError('Unable to delete the payment.');
    }
  };
 
  return (
    <div className="recurring-payments-container">
      <header className="recurring-header">
        <h1>Recurring Payments</h1>
        <button onClick={() => setShowModal(true)} className="add-payment-btn">
          + Add New Payment
        </button>
      </header>
 
      <ul className="payments-list">
        {payments.length === 0 && (
          <p className="no-payments-message">No recurring payments found.</p>
        )}
        {payments.map((payment, index) => (
          <li key={payment._id || index} className="payment-item">
            <div className="payment-details">
              <p className="payment-name">
                {payment.name || 'Unnamed Payment'}
              </p>
              <p className="payment-category">
                {payment.category || 'Uncategorized'}
              </p>
              <p className="payment-amount">${payment.amount || '0.00'}</p>
              <p className="payment-due-date">{payment.dueDate || 'N/A'}</p>
            </div>
            <button
              className="edit-payment-btn"
              onClick={() => handleEdit(index)}
            >
              Edit
            </button>
            <button
              className="delete-payment-btn"
              onClick={() => handleDelete(payment._id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
 
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Payment' : 'Add New Payment'}</h2>
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={newPayment.name}
                onChange={handleChange}
                placeholder="e.g., Rent"
              />
            </label>
            <label>
              Category:
              <input
                type="text"
                name="category"
                value={newPayment.category}
                onChange={handleChange}
                placeholder="e.g., Bills"
              />
            </label>
            <label>
              Amount ($):
              <input
                type="number"
                name="amount"
                value={newPayment.amount}
                onChange={handleChange}
                placeholder="e.g., 1500"
              />
            </label>
            <label>
              Day of the Month Due:
              <input
                type="text"
                name="dueDate"
                value={newPayment.dueDate}
                onChange={handleChange}
                placeholder="e.g., Monthly on 15th"
              />
            </label>
            <label>
              Bank Account:
              <select
                name="accountId"
                value={newPayment.accountId}
                onChange={handleChange}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.type} - {account.number}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-buttons">
              <button onClick={handleAddOrEditPayment}>
                {isEditing ? 'Save Changes' : 'Add'}
              </button>
              <button onClick={resetForm}>Cancel</button>
            </div>
            {errorMessage && (
              <div className="error-message">
                <p>
                  {errorMessage.split('\n').map((msg, idx) => (
                    <span key={idx}>
                      {msg}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
 
      {message && <p className="info-message">{message}</p>}
    </div>
  );
}
 
export default RecurringPayments;