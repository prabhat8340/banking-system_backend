const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromAccount: { type: String, required: true },
    toAccount: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    description: { type: String, required: true },
    balanceAfter: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
