import React, { useEffect, useState } from 'react';

function Notifications({ categoryLimits = {}, transactions = [] }) {
  const [notifications, setNotifications] = useState({
    budgetLimits: [],
    subscriptions: [],
    upcomingBills: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    budgetLimits: false,
    subscriptions: false,
    upcomingBills: false,
  });

  const userId = localStorage.getItem('id'); 

  useEffect(() => {
    if (!userId) {
      console.error('No logged-in user found');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const notificationsResponse = await fetch(`http://localhost:3001/api/notifications?userId=${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
    
        if (!notificationsResponse.ok) {
          console.error('Failed to fetch notifications:', notificationsResponse.status);
          return;
        }
    
        const notificationsData = await notificationsResponse.json();
    
        const spentPerCategory = (transactions || []).reduce((totals, transaction) => {
          const { category, amount } = transaction;
          if (!totals[category]) totals[category] = 0;
          totals[category] += amount;
          return totals;
        }, {});
    
        const budgetLimitNotifications = Object.keys(categoryLimits || {}).reduce((alerts, category) => {
          const limit = categoryLimits[category];
          const spent = spentPerCategory[category] || 0;
          if (limit && spent / limit >= 0.9) {
            alerts.push({
              category,
              spent,
              limit,
              percentage: Math.round((spent / limit) * 100),
            });
          }
          return alerts;
        }, []);
    
        setNotifications({
          ...notificationsData,
          budgetLimits: budgetLimitNotifications,
        });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    fetchNotifications();
  }, [userId, categoryLimits, transactions]);

  const toggleSection = (section) => {
    setExpandedSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section],
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
