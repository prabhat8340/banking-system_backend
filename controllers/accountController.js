const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const CheckbookRequest = require('../models/CheckbookRequest');
const FixedDeposit = require('../models/FixedDeposit');
const { logAction } = require('../middleware/auth');

exports.getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('balance accountNumber');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching balance.' });
    }
};

exports.deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        if (amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });

        const user = await User.findById(req.session.userId);
        user.balance += parseFloat(amount);
        await user.save();

        await Transaction.create({
            userId: user._id,
            fromAccount: 'SELF',
            toAccount: user.accountNumber,
            amount,
            type: 'Credit',
            description: 'Self Deposit',
            balanceAfter: user.balance
        });

        await logAction(user._id, 'Deposit', req, `Amount: ${amount}`);
        res.json({ message: 'Deposit successful.', balance: user.balance });
    } catch (err) {
        res.status(500).json({ message: 'Error during deposit.' });
    }
};

exports.withdraw = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.session.userId);

        if (amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
        if (user.balance - amount < 500) {
            return res.status(400).json({ message: 'Insufficient balance. Minimum ₹500 must remain.' });
        }

        user.balance -= parseFloat(amount);
        await user.save();

        await Transaction.create({
            userId: user._id,
            fromAccount: user.accountNumber,
            toAccount: 'CASH',
            amount,
            type: 'Debit',
            description: 'Cash Withdrawal',
            balanceAfter: user.balance
        });

        await logAction(user._id, 'Withdrawal', req, `Amount: ${amount}`);
        res.json({ message: 'Withdrawal successful.', balance: user.balance });
    } catch (err) {
        res.status(500).json({ message: 'Error during withdrawal.' });
    }
};

exports.getBeneficiaries = async (req, res) => {
    try {
        const beneficiaries = await Beneficiary.find({ userId: req.session.userId });
        res.json(beneficiaries);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching beneficiaries.' });
    }
};

exports.addBeneficiary = async (req, res) => {
    try {
        const { beneficiaryAccount, confirmAccount, nickname } = req.body;
        if (beneficiaryAccount !== confirmAccount) {
            return res.status(400).json({ message: 'Account numbers do not match.' });
        }

        const targetUser = await User.findOne({ accountNumber: beneficiaryAccount });
        if (!targetUser) {
            return res.status(400).json({ message: 'Beneficiary account not found.' });
        }

        const currentUser = await User.findById(req.session.userId);
        if (beneficiaryAccount === currentUser.accountNumber) {
            return res.status(400).json({ message: 'Cannot add yourself as beneficiary.' });
        }

        const existing = await Beneficiary.findOne({ userId: req.session.userId, beneficiaryAccount });
        if (existing) {
            return res.status(400).json({ message: 'Beneficiary already added.' });
        }

        await Beneficiary.create({
            userId: req.session.userId,
            beneficiaryAccount,
            nickname
        });

        res.status(201).json({ message: 'Beneficiary added successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding beneficiary.' });
    }
};

exports.deleteBeneficiary = async (req, res) => {
    try {
        await Beneficiary.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
        res.json({ message: 'Beneficiary deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting beneficiary.' });
    }
};

exports.checkbookRequest = async (req, res) => {
    try {
        await CheckbookRequest.create({ userId: req.session.userId });
        res.status(201).json({ message: 'Checkbook request submitted.' });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting request.' });
    }
};

exports.getCheckbookRequests = async (req, res) => {
    try {
        const requests = await CheckbookRequest.find({ userId: req.session.userId }).sort({ requestDate: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching requests.' });
    }
};

exports.createFD = async (req, res) => {
    try {
        const { amount, tenureMonths } = req.body;
        const user = await User.findById(req.session.userId);

        if (user.balance - amount < 500) {
            return res.status(400).json({ message: 'Insufficient balance to create FD.' });
        }

        let rate = 0;
        if (tenureMonths == 3) rate = 5;
        else if (tenureMonths == 6) rate = 6;
        else if (tenureMonths == 12) rate = 7;
        else if (tenureMonths == 24) rate = 7.5;
        else if (tenureMonths == 36) rate = 8;

        const maturityAmount = amount + (amount * rate * tenureMonths / 12 / 100);
        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + parseInt(tenureMonths));

        user.balance -= parseFloat(amount);
        await user.save();

        await FixedDeposit.create({
            userId: user._id,
            amount,
            tenureMonths,
            interestRate: rate,
            maturityAmount,
            maturityDate
        });

        await Transaction.create({
            userId: user._id,
            fromAccount: user.accountNumber,
            toAccount: 'FD-ACCOUNT',
            amount,
            type: 'Debit',
            description: `FD Created for ${tenureMonths} months`,
            balanceAfter: user.balance
        });

        res.status(201).json({ message: 'Fixed Deposit created successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error creating FD.' });
    }
};

exports.listFD = async (req, res) => {
    try {
        const fds = await FixedDeposit.find({ userId: req.session.userId }).sort({ startDate: -1 });
        res.json(fds);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching FD list.' });
    }
};
