const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    accountNumber: { type: String, unique: true },
    balance: { type: Number, default: 1000 },
    password: { type: String, required: true },
    transactionPin: { type: String, default: '1234' },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate 10-digit account number before saving
UserSchema.pre('save', async function(next) {
    if (this.isNew && !this.accountNumber) {
        let unique = false;
        while (!unique) {
            const accNo = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existing = await mongoose.models.User.findOne({ accountNumber: accNo });
            if (!existing) {
                this.accountNumber = accNo;
                unique = true;
            }
        }
    }
    
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    if (this.isModified('securityAnswer')) {
        const salt = await bcrypt.genSalt(10);
        this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
    }

    next();
});

module.exports = mongoose.model('User', UserSchema);
