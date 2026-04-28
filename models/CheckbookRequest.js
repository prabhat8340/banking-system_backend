const mongoose = require('mongoose');

const CheckbookRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestDate: { type: Date, default: Date.now },
    approvedDate: { type: Date }
});

module.exports = mongoose.model('CheckbookRequest', CheckbookRequestSchema);
