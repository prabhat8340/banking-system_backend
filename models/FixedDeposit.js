const mongoose = require('mongoose');

const FixedDepositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    maturityAmount: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    maturityDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Matured', 'Closed'], default: 'Active' }
});

module.exports = mongoose.model('FixedDeposit', FixedDepositSchema);
