import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Centralized axios instance for API calls
import './loginPage.css';
const BASE_URL = process.env.REACT_APP_SERVER_HOSTNAME;
 
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState(''); // Updated to use email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
 
  // Function to handle login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
 
    try {
      const response = await axios.post(`${BASE_URL}/user/login`, {
        email,
        password,
      }); // Call backend API
      const { token } = response.data;
 
      // Save token and trigger onLogin callback
      localStorage.setItem('token', token);
      localStorage.setItem('id', response.data.user.id);
      onLogin(token);
 
      // Redirect to the home page
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };
 
  return (
    <div className="login-container">
      <h2>Login</h2>
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
      {error && <p className="error">{error}</p>}
      <button onClick={handleLogin}>Login</button>
 
      {/* Registration link */}
      <div className="register-container">
        <Link to="/register" className="register-link">
          Not registered? Create an account
        </Link>
      </div>
    </div>
  );
};
 
export default LoginPage;