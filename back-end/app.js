import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/auth.js';
 
//MOCK DATA
import budgetLimits from './mocks/budgetLimits.js';
import recurringBills from './mocks/recurringBills.js';
import transactionData from './mocks/transactionData.js';
import goals from './mocks/goals.js';
import { getNotifications } from './notifications.js';
 
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt'; // Import bcrypt for hashing passwords
 
// Import User and BudgetGoal models (lowercase filenames)
import User from './models/User.js';
import RecurringPayment from './models/RecurringPayment.js';
import router from './userRoutes.js';
 
// import BudgetGoal from './models/budgetGoal.js';
 
dotenv.config({ silent: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
/* Initialize Express App */
const app = express();
 
/* ======================= Middleware ======================= */
app.use(morgan('dev', { skip: (req, res) => process.env.NODE_ENV === 'test' }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
/* ======================= Data Storage ======================= */
// Temporary in-memory storage for accounts and debts
const accounts = [];
const debts = [];
 
// connect to the database
console.log('MongoDB URI:', process.env.MONGODB_URI);
 
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));
 
// Root Route
app.get('/', (req, res) => {
  res.send('Hello!');
});
 
// use the specialized routing files
app.use('/user', router); // all requests for /user/* will be handled by the user router
/* ======================= Account Routes ======================= */
// Route to get all accounts
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, 'accounts');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Route to add a new account with express validator
app.post(
  '/api/accounts',
  authenticateToken,
  [
    body('type').notEmpty().withMessage('Account type is required'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('number').notEmpty().withMessage('Account number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    const { type, amount, number } = req.body;
 
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
 
      const newAccount = { type, amount, number };
      user.accounts.push(newAccount);
      await user.save();
      res.status(201).json(newAccount);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
 
// Route to edit an account by ID with express validator
app.put(
  '/api/accounts/:accountId',
  authenticateToken,
  [
    body('type').optional().notEmpty().withMessage('Account type is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('number')
      .optional()
      .notEmpty()
      .withMessage('Account number is required'),
  ],
  async (req, res) => {
    const { accountId } = req.params;
    const { type, amount, number } = req.body;
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
 
      const account = user.accounts.id(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
 
      if (type) account.type = type;
      if (amount != null) account.amount = amount;
      if (number) account.number = number;
 
      await user.save();
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
 
// Route to delete an account by ID
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
 
    const accountIdObject = new mongoose.Types.ObjectId(accountId);
 
    const user = await User.findOneAndUpdate(
      { 'accounts._id': accountIdObject },
      { $pull: { accounts: { _id: accountIdObject } } },
      { new: true }
    );
 
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }
 
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Error deleting account' });
  }
});
 
/* ======================= Debt Routes ======================= */
 
// Route to get all debts
app.get('/api/debts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, 'debts');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.debts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const calculateDueDates = (startDate, schedule, totalPayments) => {
  const dueDates = [];
  const currentDate = new Date(startDate);
  for (let i = 0; i < totalPayments; i++) {
    dueDates.push({
      date: new Date(currentDate), 
      isPaid: false, 
    });

    // Increment the date based on the schedule
    if (schedule === 'Bi-weekly') currentDate.setDate(currentDate.getDate() + 14);
    if (schedule === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
    if (schedule === 'Annually') currentDate.setFullYear(currentDate.getFullYear() + 1);
  }
  return dueDates;
};
 
// Route to add a new debt with express validator
app.post(
  '/api/debts',
  authenticateToken,
  [
    body('type').notEmpty().withMessage('Debt type is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('dueDate').notEmpty().withMessage('Due date is required'),
    body('paymentSchedule').notEmpty().withMessage('Payment schedule is required'),
    body('totalPayments').isInt({ min: 1 }).withMessage('Total payments must be a positive integer'),
  ],
  async (req, res) => {
    console.log('Request body:', req.body);

    const { type, amount, dueDate, paymentSchedule, totalPayments } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.error('User not found:', req.user.id);
        return res.status(404).json({ error: 'User not found' });
      }

      const dueDates = calculateDueDates(new Date(dueDate), paymentSchedule, parseInt(totalPayments, 10)).map((due) => ({
        date: new Date(due.date), 
        isPaid: Boolean(due.isPaid), 
      }));

      console.log('Calculated due dates:', dueDates);

      const paymentAmount = parseFloat(amount) / parseInt(totalPayments, 10);
      const newDebt = {
        type: type.toString(),
        amount: parseFloat(amount), 
        dueDate: new Date(dueDate), 
        paymentSchedule: paymentSchedule.toString(),
        dueDates, 
        paymentAmount,
      };

      console.log('New debt object:', newDebt);

      user.debts.push(newDebt);
      await user.save();

      console.log('Debt successfully added.');
      res.status(201).json(newDebt);
    } catch (error) {
      console.error('Error in POST /api/debts:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);
 
// Route to edit a debt by ID with express validator
app.put(
  '/api/debts/:debtId',
  authenticateToken,
  [
    body('type').optional().notEmpty().withMessage('Debt type is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('dueDate').optional().notEmpty().withMessage('Due date is required'),
    body('paymentSchedule')
      .optional()
      .notEmpty()
      .withMessage('Payment schedule is required'),
  ],
  async (req, res) => {
    const { debtId } = req.params;
    const { type, amount, dueDate, paymentSchedule } = req.body;
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
 
      const debt = user.debts.id(debtId);
      if (!debt) {
        return res.status(404).json({ error: 'Debt not found' });
      }
 
      if (type) debt.type = type;

      if (amount != null || dueDate || paymentSchedule || req.body.totalPayments) {
        if (amount != null) debt.amount = amount;
        if (dueDate) debt.dueDate = dueDate;
        if (paymentSchedule) debt.paymentSchedule = paymentSchedule;
    
        const totalPayments = req.body.totalPayments || debt.dueDates.length;
    
        const newDueDates = calculateDueDates(debt.dueDate, debt.paymentSchedule, totalPayments);
        debt.dueDates = newDueDates;
        debt.paymentAmount = debt.amount / totalPayments;
      }
 
      await user.save();
      res.json(debt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.put(
  '/api/debts/:debtId/dueDates/:dateIndex',
  authenticateToken,
  [
    body('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isMongoId()
      .withMessage('Account ID must be a valid MongoDB ObjectId'),
    body('isUndo')
      .notEmpty()
      .withMessage('isUndo is required')
      .isBoolean()
      .withMessage('isUndo must be a boolean value'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { debtId, dateIndex } = req.params;
    const { accountId, isUndo } = req.body; 

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const debt = user.debts.id(debtId);
      if (!debt || !debt.dueDates[dateIndex]) {
        return res.status(404).json({ error: 'Debt or due date not found' });
      }

      const account = user.accounts.id(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const paymentAmount = debt.paymentAmount;

      if (isUndo) {
        if (!debt.dueDates[dateIndex].isPaid) {
          return res.status(400).json({ error: 'This due date is not marked as paid.' });
        }
        account.amount += paymentAmount;
        debt.dueDates[dateIndex].isPaid = false;
      } else {
        if (debt.dueDates[dateIndex].isPaid) {
          return res.status(400).json({ error: 'This due date is already marked as paid.' });
        }
        if (account.amount < paymentAmount) {
          return res.status(400).json({ error: 'Insufficient funds in the account.' });
        }
        account.amount -= paymentAmount;
        debt.dueDates[dateIndex].isPaid = true;
      }

      await user.save();

      res.status(200).json({ debt, account });
    } catch (error) {
      console.error('Error updating due date:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
 
// Route to delete a debt by ID
app.delete('/api/debts/:debtId', authenticateToken, async (req, res) => {
  const { debtId } = req.params;
 
  try {
    const debtIdObject = new mongoose.Types.ObjectId(debtId);
 
    const user = await User.findOneAndUpdate(
      { 'debts._id': debtIdObject },
      { $pull: { debts: { _id: debtIdObject } } },
      { new: true }
    );
 
    if (!user) {
      return res.status(404).json({ error: 'Debt not found' });
    }
 
    res.status(200).json({ message: 'Debt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
/* ======================= Goal Routes ======================= */
 
app.get('/goals', async (req, res) => {
  const { userId } = req.query;
 
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
 
  try {
    const user = await User.findById(userId).select('goals');
    if (!user || !user.goals) {
      return res.status(404).json({ message: 'No goals found for this user' });
    }
 
    res.json(user.goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Create a new goal
app.post(
  '/goals',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('name').notEmpty().withMessage('Goal name is required'),
    body('targetAmount')
      .isNumeric()
      .withMessage('Target amount must be a number'),
    body('frequency').notEmpty().withMessage('Frequency is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    const { userId, name, targetAmount, frequency } = req.body;
 
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
 
      const newGoal = {
        _id: new mongoose.Types.ObjectId(),
        name,
        targetAmount,
        frequency,
        currentAmount: 0,
      };
 
      user.goals.push(newGoal);
      await user.save();
 
      res
        .status(201)
        .json({ message: 'Goal created successfully', goal: newGoal });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
 
//update a goal
app.put('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const { userId, name, targetAmount, frequency, currentAmount } = req.body;
 
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
 
  try {
    const user = await User.findOne({ _id: userId, 'goals._id': goalId });
    if (!user) {
      return res.status(404).json({ message: 'Goal not found' });
    }
 
    const goal = user.goals.id(goalId);
    if (name) goal.name = name;
    if (targetAmount) goal.targetAmount = targetAmount;
    if (frequency) goal.frequency = frequency;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
 
    await user.save();
    res.status(200).json({ message: 'Goal updated successfully', goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
app.delete('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const userId = req.query.userId || req.headers['user-id'];
 
  console.log('Received userId:', userId, 'and goalId:', goalId);
 
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
 
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
 
    const initialGoalCount = user.goals.length;
    user.goals = user.goals.filter((goal) => goal._id.toString() !== goalId);
 
    if (user.goals.length === initialGoalCount) {
      return res.status(404).json({ message: 'Goal not found' });
    }
 
    await user.save();
 
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error during goal deletion:', error);
    res.status(500).json({ error: error.message });
  }
});
 
// Link a transaction to a goal
app.post('/goals/:goalId/transactions', async (req, res) => {
  const { goalId } = req.params;
  const { userId, transactionId, amount } = req.body;

  try {
      const user = await User.findOne({ _id: userId, 'goals._id': goalId });
      if (!user) {
          return res.status(404).json({ message: 'Goal not found' });
      }

      const goal = user.goals.id(goalId);
      const transaction = user.transactions.id(transactionId);
      if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' });
      }

      goal.linkedTransactions.push({
          transactionId: transactionId,
          amount: amount
      });

      goal.currentAmount += Number(amount);

      await user.save();
      res.json({ 
          message: 'Transaction linked successfully', 
          goal,
          linkedTransaction: {
              transactionId,
              amount,
              merchant: transaction.merchant,
              date: transaction.date
          }
      });
  } catch (error) {
      console.error('Error linking transaction:', error);
      res.status(500).json({ error: error.message });
  }
});
 // Get linked transactions for a goal
 app.get('/goals/:goalId/transactions', async (req, res) => {
  const { goalId } = req.params;
  const { userId } = req.query;

  try {
      const user = await User.findOne({ _id: userId, 'goals._id': goalId });
      if (!user) {
          return res.status(404).json({ message: 'Goal not found' });
      }

      const goal = user.goals.id(goalId);
      
      const linkedTransactionsWithDetails = goal.linkedTransactions.map(linked => {
          const transaction = user.transactions.id(linked.transactionId);
          return {
              ...linked.toObject(),
              merchant: transaction?.merchant,
              date: transaction?.date
          };
      });

      res.json(linkedTransactionsWithDetails);
  } catch (error) {
      console.error('Error fetching linked transactions:', error);
      res.status(500).json({ error: error.message });
  }
});

// Unlink transaction from goal
app.delete('/goals/:goalId/unlink/:transactionId', async (req, res) => {
  const { goalId, transactionId } = req.params;
  const { userId } = req.body;

  try {
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const goal = user.goals.id(goalId);
      if (!goal) {
          return res.status(404).json({ message: 'Goal not found' });
      }

      const linkedTransaction = goal.linkedTransactions.find(
          t => t.transactionId.toString() === transactionId
      );

      if (!linkedTransaction) {
          return res.status(404).json({ message: 'Linked transaction not found' });
      }

      goal.currentAmount = Math.max(0, goal.currentAmount - linkedTransaction.amount);

      goal.linkedTransactions = goal.linkedTransactions.filter(
          t => t.transactionId.toString() !== transactionId
      );

      await user.save();
      res.json({ 
          message: 'Transaction unlinked successfully', 
          goal 
      });
  } catch (error) {
      console.error('Error unlinking transaction:', error);
      res.status(500).json({ error: error.message });
  }
});
/* ======================= Transaction Routes ======================= */
// Route to get all transactions
app.get('/api/transactions', authenticateToken, [
  query('userId').isMongoId().withMessage('Invalid user ID'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.query;

  try {
    const user = await User.findById(userId).select('transactions');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to add a new transaction
app.post('/api/transactions', authenticateToken, [
  body('merchant').notEmpty().withMessage('Merchant is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').isISO8601().toDate().withMessage('Invalid date format'),
  body('accountId').isMongoId().withMessage('Invalid account ID'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { merchant, category, amount, date, userId, accountId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const account = user.accounts.id(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    account.amount -= amount;

    const newTransaction = {
      merchant,
      category,
      amount,
      date: new Date(date),
      accountId,
      _id: new mongoose.Types.ObjectId(),
    };

    user.transactions.push(newTransaction);
    await user.save();

    res.status(201).json({ transaction: newTransaction, updatedAccount: account });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { merchant, category, amount, date, userId, accountId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const transaction = user.transactions.id(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const originalAccountId = transaction.accountId;
    const originalAmount = transaction.amount;
    const originalAccount = user.accounts.id(originalAccountId);
    const targetAccount = user.accounts.id(accountId);

    if (!originalAccount || !targetAccount) {
      return res.status(404).json({ error: 'One or more accounts not found.' });
    }

    if (originalAccountId !== accountId) {
      originalAccount.amount += originalAmount;
    }

    targetAccount.amount -= parseFloat(amount);

    if (merchant) transaction.merchant = merchant;
    if (category) transaction.category = category;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (date) {
      const transactionDate = new Date(date);
      transactionDate.setUTCHours(12, 0, 0, 0);
      transaction.date = transactionDate;
    }
    if (accountId) transaction.accountId = accountId;

    await user.save();

    res.status(200).json({
      transaction,
      updatedAccounts: [originalAccount, targetAccount].filter((acc, index, self) =>
        index === self.findIndex(a => a._id.toString() === acc._id.toString())
      ),
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

 
// Route to delete a transaction by ID
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params; 
  const { userId } = req.body;
 
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
 
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
 
    const transactionIndex = user.transactions.findIndex(
      (t) => t._id.toString() === id
    );
    if (transactionIndex === -1) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    user.transactions.splice(transactionIndex, 1);
    await user.save();
 
    res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
 
/* ======================= Recurring Payments Routes ======================= */
 
app.get('/api/recurringbills', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
 
  try {
    console.log('Fetching recurring bills for user ID:', userId);
    const userRecurringBills = await RecurringPayment.find({ userId: userId });
 
    if (!userRecurringBills || userRecurringBills.length === 0) {
      return res
        .status(404)
        .json({ message: 'No recurring bills found for the user.' });
    }
 
    res.status(200).json(userRecurringBills);
  } catch (error) {
    console.error('Error fetching recurring bills:', error);
    res.status(500).json({ message: error.message });
  }
});
 
app.put(
  '/api/recurringbills/:billId',
  authenticateToken,
  [
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Name is required if provided'),
    body('category')
      .optional()
      .notEmpty()
      .withMessage('Category is required if provided'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('dueDate')
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage('Due date must be between 1 and 31'),
  ],
  async (req, res) => {
    const userId = req.user.id; 
    const billId = req.params.billId;
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    try {
      const recurringBill = await RecurringPayment.findOne({
        _id: billId,
        userId: userId,
      });
 
      if (!recurringBill) {
        return res.status(404).json({ message: 'Recurring bill not found' });
      }
 
      const updatedFields = {
        name: req.body.name || recurringBill.name,
        category: req.body.category || recurringBill.category,
        amount: req.body.amount || recurringBill.amount,
        dueDate: req.body.dueDate || recurringBill.dueDate,
      };
 
      Object.assign(recurringBill, updatedFields);
      await recurringBill.save();
      res.status(200).json(recurringBill);
    } catch (error) {
      console.error('Error updating recurring bill:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);
 
const validateRecurringBill = [
  body('userId').isMongoId().withMessage('Invalid user ID.'),
  body('accountId').isMongoId().withMessage('Invalid account ID.'),
  body('name').notEmpty().withMessage('Name is required.'),
  body('category').notEmpty().withMessage('Category is required.'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive.'),
  body('dueDate')
    .isInt({ min: 1, max: 31 })
    .withMessage('Due date must be between 1 and 31.'),
];
 
app.post(
  '/api/recurringbills',
  authenticateToken,
  validateRecurringBill,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
 
      const { userId, accountId, name, category, amount, dueDate } = req.body;
      console.log('Received request body:', req.body);
 
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ error: `User with ID ${userId} not found.` });
      }
 
      const account = user.accounts.find(
        (acc) => acc._id.toString() === accountId
      );
      if (!account) {
        return res.status(404).json({
          error: `Account with ID ${accountId} not found for user ${userId}.`,
        });
      }
 
      const newPayment = new RecurringPayment({
        userId,
        accountId,
        name,
        category,
        amount,
        dueDate,
      });
 
      await newPayment.save();
      console.log('Recurring payment created:', newPayment);
 
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating recurring payment:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);
app.delete('/api/recurringbills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RecurringPayment.findByIdAndDelete(id);
 
    if (!result) {
      return res.status(404).json({ message: 'Recurring bill not found' });
    }
 
    res.status(200).json({ message: 'Recurring bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring bill:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
/* ======================= Budget Limits Routes ======================= */
app.get('/api/budget-limits', authenticateToken, [
  query('userId').isMongoId().withMessage('Invalid user ID'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.query;

  try {
    const user = await User.findById(userId).select('budgetLimits');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.budgetLimits);
  } catch (error) {
    console.error('Error fetching budget limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/budget-limits', authenticateToken, [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('monthlyLimit').isFloat({ min: 0 }).withMessage('Monthly limit must be a positive number'),
  body('categories').isArray().withMessage('Categories must be an array'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, monthlyLimit, categories } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.budgetLimits = { monthlyLimit, categories };
    await user.save();

    res.status(200).json({ message: 'Budget limits updated successfully.' });
  } catch (error) {
    console.error('Error updating budget limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

 
/* ======================= Notification Routes ======================= */
// Route to get notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('budgetLimits');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const recurringPayments = await RecurringPayment.find({ userId });

    const filterDueWithinNextDays = (dueDate) => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let nextDueDate = new Date(currentYear, currentMonth, dueDate);
      if (currentDay > dueDate) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const diffTime = nextDueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5 && diffDays >= 0; 
    };

    const subscriptions = recurringPayments
      .filter(payment => payment.category.toLowerCase() === 'subscription' && filterDueWithinNextDays(payment.dueDate))
      .map(payment => ({
        name: payment.name,
        daysUntilDue: calculateDaysUntilDue(payment.dueDate),
      }));

    const upcomingBills = recurringPayments
      .filter(payment => payment.category.toLowerCase() !== 'subscription' && filterDueWithinNextDays(payment.dueDate))
      .map(payment => ({
        name: payment.name,
        daysUntilDue: calculateDaysUntilDue(payment.dueDate),
      }));

    const notifications = {
      budgetLimits: user.budgetLimits.categories
        .filter(category => category.limit > 0 && category.limit < category.spent)
        .map(category => ({
          name: category.name,
          spent: category.spent,
          limit: category.limit,
        })),
      subscriptions,
      upcomingBills,
    };

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

 
// POST route for logout
app.post('/api/logout', (req, res) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }
  tokenBlacklist.push(token);
  res.status(200).json({ message: 'Successfully logged out' });
});

/* ======================= Categories Routes ======================= */
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('categories');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(user.categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/categories', authenticateToken, [
  body('name').notEmpty().withMessage('Category name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.categories.some(category => category.name === name)) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    user.categories.push({ name });
    await user.save();
    res.status(201).json({ name, message: 'Category added successfully.' });
  } catch (error) {
    console.error('Error adding category:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


/* ======================= Serve Frontend (React App) ======================= */
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../front-end/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/build/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running... Front-end development server handles UI.');
  });
}
 
export default app;