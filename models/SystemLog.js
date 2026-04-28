const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    ip: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', SystemLogSchema);
