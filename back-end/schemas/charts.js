// Mock data for monthly expenses and income
const monthlyData = {
    January: { expenses: 500, income: 1900 },
    February: { expenses: 400, income: 1600 },
    March: { expenses: 700, income: 1600 },
    April: { expenses: 389, income: 1600 },
    May: { expenses: 400, income: 1600 },
    June: { expenses: 1100, income: 1800 },
    July: { expenses: 500, income: 1600 },
    August: { expenses: 400, income: 1600 },
    September: { expenses: 700, income: 1600 },
    October: { expenses: 500, income: 1600 },
    November: { expenses: 400, income: 1600 },
    December: { expenses: 690, income: 1600 },
    // Add more months if needed
  };
  
  // Mock data for spending categories
  const categoryData = [
    { category: 'Food', amount: 300 },
    { category: 'Rent', amount: 1000 },
    { category: 'Transportation', amount: 150 },
    { category: 'Entertainment', amount: 200 },
    { category: 'Other', amount: 200 },
  ];
  
  // Function to calculate monthly net balance
  function calculateMonthlyBalance(month) {
    const data = monthlyData[month];
    if (!data) {
      return { error: 'Month not found' };
    }
    return {
      ...data,
      netBalance: data.income - data.expenses,
    };
  }
  
  // Export the data and calculation function
  export default { monthlyData, categoryData, calculateMonthlyBalance };
  
