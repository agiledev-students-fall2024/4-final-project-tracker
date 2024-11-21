const budgetLimits= [
    {
      budgetId: 1, // username's personal budget
      userId: 1, // userId 1 is username's account
      name: "Personal",
      monthlyLimit: 3000,
      categoryLimits: {
        Bills: 1500,
        Groceries: 300,
        Health: 150,
        Fuel: 100,
        Shopping: 250,
        Subscription: 100,
        Transportation: 100,
        Restaurant: 150,
      },
    },
];
  
export default budgetLimits;


