import React from 'react';
import recurringBills from '../mocks/recurringBills';

function Notifications() {
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

  const upcomingBills = recurringBills
    .map((bill) => {
      const dueDay = extractDueDay(bill.dueDate);
      if (dueDay === null) return null;
      const daysUntilDue = calculateDaysUntilDue(dueDay);
      return { ...bill, daysUntilDue };
    })
    .filter((bill) => bill && bill.daysUntilDue > 0 && bill.daysUntilDue <= 5);

  return (
    <section className="notifications">
      <h2>Notifications</h2>
      <ul>
        {upcomingBills.length > 0 ? (
          upcomingBills.map((bill) => (
            <li key={bill.id}>
              💡 Upcoming {bill.category}: {bill.name} - Due in {bill.daysUntilDue} {bill.daysUntilDue === 1 ? "day" : "days"}
            </li>
          ))
        ) : (
          <li>No upcoming bills or subscriptions within the next 5 days.</li>
        )}
      </ul>
    </section>
  );
}

export default Notifications;