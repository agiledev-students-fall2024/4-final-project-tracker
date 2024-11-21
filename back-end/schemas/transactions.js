import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true }, // if still doing budgets
    merchant: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true }, 
    date: { type: Date, required: true }
});

export default mongoose.model('Transaction', transactionSchema);
