import React, { useState } from 'react';
import './header.css';

function Header({ onLogout }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [currentBudget, setCurrentBudget] = useState('Personal Budget');

  const budgetOptions = [
    'Personal Budget',
    'Create New Budget'
  ];

  const handleBudgetChange = (option) => {
    if (option === 'Create New Budget') {
      console.log("Redirect to new budget creation page");
    } else {
      setCurrentBudget(option);
    }
    setDropdownVisible(false);
  };

  return (
    <div className="header-container">
      <h1 className="header-month">{new Date().toLocaleString('default', { month: 'long' })}</h1>
      
      <div className="header-title">
        <p className="header-budget" onClick={() => setDropdownVisible(!dropdownVisible)}>
          {currentBudget}
        </p>
      </div>
      
      {dropdownVisible && (
        <ul className="dropdown-menu">
          {budgetOptions.map((option, index) => (
            <li key={index} onClick={() => handleBudgetChange(option)}>
              {option}
            </li>
          ))}
        </ul>
      )}

      {/* Logout Button */}
      <button className="logout-button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Header;
