import React, { useEffect, useState } from 'react';

function Notifications({ categoryLimits = {}, transactions = [] }) {
  const [notifications, setNotifications] = useState({
    budgetLimits: [],
    subscriptions: [],
    upcomingBills: []
  });
  const [expandedSections, setExpandedSections] = useState({
    budgetLimits: false,
    subscriptions: false,
    upcomingBills: false
  });

  const userId = localStorage.getItem('id'); 

  useEffect(() => {
    if (!userId) {
      console.error('No logged-in user found');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/notifications?userId=${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const recurringPaymentsResponse = await fetch(`http://localhost:3001/api/recurringbills?userId=${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok || !recurringPaymentsResponse.ok) {
          console.error('Failed to fetch data:', response.status, recurringPaymentsResponse.status);
          return;
        }

        const notificationsData = await response.json();
        const recurringPayments = await recurringPaymentsResponse.json();

        if (!Array.isArray(recurringPayments)) {
          console.error('Invalid recurring payments response:', recurringPayments);
          return;
        }

        const calculateDaysUntilDue = (dueDate) => {
          const today = new Date();
          const currentDay = today.getDate();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();

          let nextDueDate = new Date(currentYear, currentMonth, dueDate);
          if (currentDay > dueDate) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          }

          const diffTime = nextDueDate - today;
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        const filterDueWithinNext5Days = (dueDate) => {
          const daysUntilDue = calculateDaysUntilDue(dueDate);
          return daysUntilDue >= 0 && daysUntilDue <= 5;
        };

        const upcomingBills = recurringPayments
          .filter(
            (payment) =>
              ['bill', 'bills'].includes(payment.category.toLowerCase()) &&
              filterDueWithinNext5Days(payment.dueDate)
          )
          .map((payment) => ({
            name: payment.name,
            amount: payment.amount,
            daysUntilDue: calculateDaysUntilDue(payment.dueDate),
          }));

        const subscriptions = recurringPayments
          .filter(
            (payment) =>
              ['subscription', 'subscriptions'].includes(payment.category.toLowerCase()) &&
              filterDueWithinNext5Days(payment.dueDate)
          )
          .map((payment) => ({
            name: payment.name,
            amount: payment.amount,
            daysUntilDue: calculateDaysUntilDue(payment.dueDate),
          }));

        const spentPerCategory = (transactions || []).reduce((totals, transaction) => {
          const { category, amount } = transaction;
          if (!totals[category]) totals[category] = 0;
          totals[category] += amount;
          return totals;
        }, {});

        const budgetLimitNotifications = Object.keys(categoryLimits || {}).reduce((alerts, category) => {
          const limit = categoryLimits[category];
          const spent = spentPerCategory[category] || 0;
          if (limit && spent / limit >= 0.8) {
            alerts.push({
              category,
              spent,
              limit,
              percentage: Math.round((spent / limit) * 100)
            });
          }
          return alerts;
        }, []);

        setNotifications({
          ...notificationsData,
          upcomingBills,
          subscriptions,
          budgetLimits: budgetLimitNotifications
        });
      } catch (error) {
        console.error('Failed to fetch notifications or recurring payments:', error);
      }
    };

    fetchNotifications();
  }, [userId, categoryLimits, transactions]);

  const toggleSection = (section) => {
    setExpandedSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section]
    }));
  };

  return (
    <section className="notifications">
      <h2>Notifications</h2>
      <ul>
        {/* Budget Limits Notifications */}
        <li onClick={() => toggleSection('budgetLimits')}>
          Budget Limits: {notifications.budgetLimits.length} updates
          {expandedSections.budgetLimits && (
            <ul className="expanded-section">
              {notifications.budgetLimits.map((limit, index) => (
                <li key={index} className="expanded-section-item">
                  {limit.category}: ${limit.spent} / ${limit.limit} spent ({limit.percentage}% of limit)
                </li>
              ))}
            </ul>
          )}
        </li>

        {/* Subscriptions Notifications */}
        <li onClick={() => toggleSection('subscriptions')}>
          Subscriptions: {notifications.subscriptions.length} updates
          {expandedSections.subscriptions && (
            <ul className="expanded-section">
              {notifications.subscriptions.map((subscription, index) => (
                <li key={index} className="expanded-section-item">
                  {subscription.name} - Due in {subscription.daysUntilDue} day(s)
                </li>
              ))}
            </ul>
          )}
        </li>

        {/* Upcoming Bills Notifications */}
        <li onClick={() => toggleSection('upcomingBills')}>
          Upcoming Bills: {notifications.upcomingBills.length} updates
          {expandedSections.upcomingBills && (
            <ul className="expanded-section">
              {notifications.upcomingBills.map((bill, index) => (
                <li key={index} className="expanded-section-item">
                  {bill.name} - Due in {bill.daysUntilDue} day(s)
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </section>
  );
}

export default Notifications;
