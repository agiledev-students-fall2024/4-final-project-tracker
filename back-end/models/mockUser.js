import mongoose from 'mongoose';
import User from './User.js';
import transactionData from '../mocks/transactionData.js';
import recurringBills from '../mocks/recurringBills.js';
import budgetLimits from '../mocks/budgetLimits.js';
import goals from '../mocks/goals.js';

const MONGODB_URI = 'mongodb+srv://chris_bobadilla:pefvup-9bavpo-cuszYt@cluster0.i2kpl.mongodb.net/financial-tracker?retryWrites=true&w=majority'; // Replace with your connection string

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

// creating a mock user
async function createMockUser() {
  try {
    const existingUser = await User.findOne({ username: 'johndoe' });
    if (existingUser) {
      console.log('User johndoe already exists in the database.');
      return;
    }

    const preparedBudgetLimits = {
      monthlyLimit: budgetLimits[0].monthlyLimit,
      categories: Object.entries(budgetLimits[0].categoryLimits).map(([name, limit]) => ({ name, limit })),
      other: 0, // excess to be calculated
    };

    const newUser = new User({
      username: 'johndoe',
      email: 'johndoe@example.com',
      profilePicture: '', 
      password: 'johnspassword', // will need to be hashed in database
      accounts: [
        {
          type: 'Checking',
          amount: 2000,
          number: '1234567890',
        },
        {
          type: 'Savings',
          amount: 5000,
          number: '0987654321',
        },
      ],
      debts: [
        {
          type: 'Credit Card',
          amount: 1000,
          dueDate: new Date('2024-12-01'),
          paymentSchedule: 'Monthly',
        },
        {
          type: 'Student Loan',
          amount: 15000,
          dueDate: new Date('2024-12-15'),
          paymentSchedule: 'Monthly',
        },
      ],
      transactions: transactionData.map((t) => ({
        ...t,
        date: new Date(t.date), 
      })),
      recurringBills: recurringBills.map((bill) => ({
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        dueDate: bill.dueDate,
      })),
      budgetLimits: preparedBudgetLimits,
      goals: goals.map((goal) => ({
        name: goal.name,
        currentAmount: goal.current,
        targetAmount: goal.target,
        frequency: 'monthly', // just for example, will be set by user
        collaborators: [], // empty for now
      })),
    });

    // save user
    await newUser.save();
    console.log('Mock user johndoe created successfully');
  } catch (err) {
    console.error('Error creating mock user:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
(async () => {
  await connectDB();
  await createMockUser();
})();
