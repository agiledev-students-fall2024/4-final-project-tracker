import cron from 'node-cron';
import RecurringPayment from '../models/RecurringPayment.js'; // Adjust the path based on your project structure
import User from '../models/User.js';
 
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily recurring payment scheduler...');
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  console.log(day); // Outputs the day, e.g., "07" if today is December 7.
  // Fetch all recurring payments due today
  const recurringPayments = await RecurringPayment.find({ dueDate: today });
 
  for (const payment of recurringPayments) {
    // Add transaction for the recurring payment
    try {
      // Find the user in the database
      const user = await User.findById(payment.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
 
      // Create a new transaction object
      const newTransaction = {
        merchant: payment.name,
        category: payment.category,
        amount: payment.amount,
        date: today,
        _id: new mongoose.Types.ObjectId(), // Generate a unique ID for the transaction
      };
 
      // Add the transaction to the user's transactions array
      user.transactions.push(newTransaction);
 
      // Save the updated user document
      await user.save();
 
      // Respond with the newly added transaction
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});