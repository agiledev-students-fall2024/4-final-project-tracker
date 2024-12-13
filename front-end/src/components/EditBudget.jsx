import React, { useState, useEffect } from 'react';
import './EditBudget.css';
import CategoryDropdown from './categoryDropdown';
 
function EditBudget({ currentBudget, onUpdateBudget, onClose }) {
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [categories, setCategories] = useState([]);
 
  useEffect(() => {
    if (currentBudget) {
      setMonthlyLimit(currentBudget.monthlyLimit || '');
      setCategories(currentBudget.categories || []);
    }
  }, [currentBudget]);
 
  const handleAddCategory = () => {
    setCategories([...categories, { name: '', limit: '' }]);
  };
 
  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };
 
  const handleSubmit = async () => {
    const validCategories = categories.filter((cat) => cat.name && cat.limit);
    const payload = {
      userId: localStorage.getItem('id'),
      monthlyLimit: parseFloat(monthlyLimit),
      categories: validCategories.map((cat) => ({
        name: cat.name,
        limit: parseFloat(cat.limit),
      })),
    };
 
    try {
      const response = await fetch('http://localhost:3001/api/budget-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
 
      if (!response.ok) throw new Error('Failed to update budget');
 
      onUpdateBudget({
        monthlyLimit: payload.monthlyLimit,
        categories: payload.categories,
      });
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };
 
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Budget</h2>
        <label>
          Monthly Limit:
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
          />
        </label>
        <div>
          <h3>Sublimits:</h3>
          {categories.map((category, index) => (
            <div key={index} className="category-input">
              <CategoryDropdown
                selectedCategory={category.name}
                onChange={(value) => handleCategoryChange(index, 'name', value)}
                allowCustom={true}
              />
              <input
                type="number"
                placeholder="Limit"
                value={category.limit}
                onChange={(e) =>
                  handleCategoryChange(index, 'limit', e.target.value)
                }
              />
            </div>
          ))}
          <button className="add-category-button" onClick={handleAddCategory}>
            Add Category
          </button>
        </div>
        <button className="button" onClick={handleSubmit}>
          Save
        </button>
        <button className="button cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
 
export default EditBudget;
 
 