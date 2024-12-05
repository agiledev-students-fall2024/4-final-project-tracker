import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/home';
import Goal from './pages/Goal';
import LoginPage from './pages/loginPage';
import Registration from './pages/registration';
import RecurringPayments from './pages/RecurringPayments';
import Me from './pages/me';
import Balances from './pages/Balances';
import Charts from './pages/charts';
import Transactions from './pages/Transactions';
import BottomNav from './components/bottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/header';

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));

  const handleLogin = (token) => {
    localStorage.setItem('token', token); // Save token in local storage
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token
    setAuthToken(null);
  };

  return (
    <Router>
      <AppContent authToken={authToken} handleLogin={handleLogin} handleLogout={handleLogout} />
    </Router>
  );
}

function AppContent({ authToken, handleLogin, handleLogout }) {
  const location = useLocation();

  return (
    <>
      {authToken && <Header onLogout={handleLogout} />} {/* Show header when logged in */}

      <Routes>
        {!authToken ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<Registration />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goal"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Goal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recurringPayments"
              element={
                <ProtectedRoute authToken={authToken}>
                  <RecurringPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Me />
                </ProtectedRoute>
              }
            />
            <Route
              path="/balances"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Balances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/charts"
              element={
                <ProtectedRoute authToken={authToken}>
                  <Charts />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>

      {authToken && location.pathname !== '/login' && <BottomNav />}
    </>
  );
}

export default App;
