// const recurringBills = require('./mocks/recurringBills');
import recurringBills from './schemas/recurringBills.js';

// calculate upcoming bills based on current date
const getUpcomingBills = () => {
  const today = new Date();
  const currentDay = today.getDate();

  const calculateDaysUntilDue = (dueDay) => {
    if (dueDay >= currentDay) {
      return dueDay - currentDay;
    } else {
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return daysInCurrentMonth - currentDay + dueDay;
    }
  };

  const extractDueDay = (dueDate) => {
    const match = dueDate.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  const notifications = {
    upcomingBills: [],
    subscriptions: [],
    budgetLimits: []  // still need to implement
  };

  recurringBills.forEach((bill) => {
    const dueDay = extractDueDay(bill.dueDate);
    if (dueDay === null) return;

    const daysUntilDue = calculateDaysUntilDue(dueDay);

    if (daysUntilDue > 0 && daysUntilDue <= 5) {  // notify for bills due in 5 days
        const category = bill.category.toLowerCase();
    
        if (category.includes('subscription') || category.includes('subscriptions')) {
          notifications.subscriptions.push({ ...bill, daysUntilDue });
        } else if (category.includes('bill') || category.includes('bills')) {
          notifications.upcomingBills.push({ ...bill, daysUntilDue });
        }
      }
  });

  return notifications;
};


export { getUpcomingBills as getNotifications };

