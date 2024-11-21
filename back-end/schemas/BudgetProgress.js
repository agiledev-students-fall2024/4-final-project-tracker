import budgetLimits from './budgetLimits.js';
import transactionData from './transactionData.jsx';

function BudgetProgress() {
  const spentPerCategory = transactionData.reduce((totals, transaction) => {
    const { category, amount } = transaction;
    if (!totals[category]) totals[category] = 0;
    totals[category] += amount;
    return totals;
  }, {});

  const progressData = Object.keys(budgetLimits).map(category => {
    const spent = spentPerCategory[category] || 0;
    const limit = budgetLimits[category];
    const percentage = limit ? (spent / limit) * 100 : 0;
    return {
      category,
      spent,
      limit,
      percentage
    };
  });

  const totalSpent = Object.values(spentPerCategory).reduce((acc, amount) => acc + amount, 0);
  
  const totalLimit = budgetLimits.MonthlyBudget || 3000;
  const overallSpent = (totalSpent / totalLimit) * 100;
  const remaining = totalLimit - totalSpent;

  console.log("Category Totals:", spentPerCategory);
  console.log("Total Spent:", totalSpent);
  console.log("Total Limit:", totalLimit);

  return {
    progressData,
    overall: {
      totalBudget: totalLimit,
      totalSpent,
      remaining,
      overallSpent: Math.min(overallSpent, 100) 
    }
  };
}

export default BudgetProgress;