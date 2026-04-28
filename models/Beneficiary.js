const mongoose = require('mongoose');

const BeneficiarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    beneficiaryAccount: { type: String, required: true },
    nickname: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Beneficiary', BeneficiarySchema);
