import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName:{type: String, required: true},
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profilePicture: String,
    password: { type: String, required: true },

    accounts: [
        {
          type: { type: String, required: true },
          amount: { type: Number, required: true },
          number: { type: String, required: true },
        },
    ],
    debts: [
      {
        type: { type: String, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        paymentSchedule: { type: String, required: true }, 
        ispaidIncurrentPeriod: {type: Boolean, required: true},
        accountId: {type: mongoose.Schema.Types.ObjectId, required:true},

      },
    ],
    transactions: [
      {
        merchant: { type: String, required: true },
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
      },
    ],
    goals: [
      {
        name: { type: String, required: true },
        currentAmount: { type: Number, default: 0, min: 0 }, 
        frequency: {type: String, enum: ['daily', 'monthly', 'annual'], required: true,},
        targetAmount: { type: Number, required: true },
        collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
      },
    ],
    budgetLimits: {
      monthlyLimit: { type: Number, required: true, default: 0 },
      categories: [
          {
              name: { type: String, required: true },
              limit: { type: Number, required: true, default: 0 }, 
          }
      ],
      other: { type: Number, default: 0 },
    },
    categories: [
      {
                    name: { type: String, required: true, unique: true }, 
      },
    ],  

});

userSchema.pre('save', async function (next) {
  // Hash the password if it's modified
  if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
  }

  // Add default categories for new users
  if (this.isNew) {
      this.categories = [
          { name: 'Food' },
          { name: 'Transportation' },
          { name: 'Rent' },
          { name: 'Utilities' },
          { name: 'Entertainment' },
      ];
  }

  next();
});


export default mongoose.model('User', userSchema);