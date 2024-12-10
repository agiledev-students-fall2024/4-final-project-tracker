import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './registration.css';
const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;
 
const Registration = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
 
  const handleRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
 
    if (!firstName || !lastName || !username || !email || !password) {
      setErrorMessage('All fields are required.');
      return;
    }
 
    try {
      await axios.post(`${BASE_URL}/user/signup`, {
        firstName,
        lastName,
        username,
        email,
        password,
      });
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorResponse = err.response?.data;
      if (errorResponse?.errors) {
        // If there are validation errors, format them into a readable message
        const formattedErrors = errorResponse.errors
          .map((error) => error.msg) // Extract error messages
          .join('\n'); // Join them into a single string
        setErrorMessage(formattedErrors);
      } else {
        setErrorMessage(errorResponse?.message || 'Registration failed.');
      }
    }
  };
  return (
    <div className="registration-container">
      <h2>Register</h2>
      <form onSubmit={handleRegistration}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>
      {/*errorMessage && <p className="error-message">{errorMessage}</p>*/}
      <div>
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
      {successMessage && <p className="success-message">{successMessage}</p>}
      <div className="login-link-container">
        <Link to="/login" className="login-link">
          Already have an account? Go back to login
        </Link>
      </div>
    </div>
  );
};
 
export default Registration;
 