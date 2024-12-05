import User from '../models/User.js';

export async function getUserCategories(userId) {
  try {
    const user = await User.findById(userId);

    // Extract distinct categories from both transactions and recurring bills
    const transactionCategories = user.transactions.map(t => t.category);
    const recurringBillCategories = user.recurringBills.map(rb => rb.category);

    // Merge and deduplicate categories
    const uniqueCategories = [...new Set([...transactionCategories, ...recurringBillCategories])];
    return uniqueCategories;
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
}
