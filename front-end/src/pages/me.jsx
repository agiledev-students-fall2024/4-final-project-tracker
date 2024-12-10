import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './me.css';
 
const Me = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editFields, setEditFields] = useState({
    first_name: false,
    last_name: false,
    username: false,
    email: false,
    password: false,
  });
  const [updatedData, setUpdatedData] = useState({});
  const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;
 
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        if (!token) throw new Error('User not authenticated.');
        const userId = localStorage.getItem('id');
        console.log(
          'Stored userId in localStorage:',
          localStorage.getItem('id')
        );
        const response = await axios.get(`${BASE_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }, // Send token in headers
        });
 
        setUser(response.data); // Set user data
        setUpdatedData(response.data); // Prepare editable data
      } catch (error) {
        setError('Unable to load user data.');
        console.error('Error fetching user data:', error);
      }
    };
 
    fetchUserData();
  }, []);
 
  const toggleEditField = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };
 
  const handleChange = (e, field) => {
    setUpdatedData({ ...updatedData, [field]: e.target.value });
  };
 
  const handleSave = async (field) => {
    // Clear previous messages
    setMessage('');
    setErrorMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('id');
      if (!token) throw new Error('User not authenticated.');
 
      const updatePayload = { [field]: updatedData[field] };
 
      const response = await axios.put(
        `${BASE_URL}/user/${userId}/update`,
        updatePayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
 
      setMessage(response.data.message || `"${field}" has been updated!`);
      toggleEditField(field);
    } catch (err) {
      const errorResponse = err.response?.data;
      if (errorResponse?.errors) {
        // If there are validation errors, format them into a readable message
        const formattedErrors = errorResponse.errors
          .map((error) => error.msg) // Extract error messages
          .join('\n'); // Join them into a single string
        setErrorMessage(formattedErrors);
      } else {
        setError('Failed to update user information.');
        console.error('Error updating user data:', error);
      }
    }
  };
 
  if (error) {
    return <div className="error">{error}</div>;
  }
 
  if (!user) {
    return <div>Loading...</div>;
  }
 
  return (
    <div className="me-container">
      <h2>My Account</h2>
      <img
        className="profile-pic"
        src={`https://picsum.photos/seed/${user.username}/100`}
        alt="Profile"
      />
 
      {/* Editable Fields */}
      {['first_name', 'last_name', 'username', 'email', 'password'].map(
        (field) => (
          <div key={field} className="field-container">
            <label>
              <strong>{field.replace('_', ' ').toUpperCase()}:</strong>
            </label>
            {editFields[field] ? (
              <div className="edit-input-container">
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={updatedData[field] || ''}
                  onChange={(e) => handleChange(e, field)}
                  placeholder={`Enter new ${field.replace('_', ' ')}`}
                  className="edit-input"
                />
                <button className="save-btn" onClick={() => handleSave(field)}>
                  Save
                </button>
              </div>
            ) : (
              <div className="display-container">
                <span className="field-value">
                  {field === 'password' ? '***' : updatedData[field]}
                </span>
                <button
                  className="edit-btn"
                  onClick={() => toggleEditField(field)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )
      )}
      {/* Display Info Message */}
      {message && <p className="info-message">{message}</p>}
      {/* Display error Message */}
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
  );
};
 
export default Me;