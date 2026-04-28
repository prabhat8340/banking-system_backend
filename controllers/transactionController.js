const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const { logAction } = require('../middleware/auth');

exports.transfer = async (req, res) => {
    try {
        const { beneficiaryAccount, amount, transactionPin, description } = req.body;
        const sender = await User.findById(req.session.userId);

        if (transactionPin !== sender.transactionPin) {
            return res.status(400).json({ message: 'Invalid Transaction PIN.' });
        }

        if (amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });

        if (sender.balance - amount < 500) {
            return res.status(400).json({ message: 'Insufficient balance. Min ₹500 must remain.' });
        }

        // Check if beneficiary is added
        const isBeneficiary = await Beneficiary.findOne({ userId: sender._id, beneficiaryAccount });
        if (!isBeneficiary) {
            return res.status(400).json({ message: 'Transfer only allowed to added beneficiaries.' });
        }

        const receiver = await User.findOne({ accountNumber: beneficiaryAccount });
        if (!receiver) {
            return res.status(400).json({ message: 'Receiver account not found.' });
        }

        if (sender.accountNumber === receiver.accountNumber) {
            return res.status(400).json({ message: 'Self-transfer is not allowed.' });
        }

        // Perform Transfer
        sender.balance -= parseFloat(amount);
        receiver.balance += parseFloat(amount);

        await sender.save();
        await receiver.save();

        // Create Transactions
        await Transaction.create([
            {
                userId: sender._id,
                fromAccount: sender.accountNumber,
                toAccount: receiver.accountNumber,
                amount,
                type: 'Debit',
                description: description || `Transfer to ${receiver.name}`,
                balanceAfter: sender.balance
            },
            {
                userId: receiver._id,
                fromAccount: sender.accountNumber,
                toAccount: receiver.accountNumber,
                amount,
                type: 'Credit',
                description: description || `Transfer from ${sender.name}`,
                balanceAfter: receiver.balance
            }
        ]);

        await logAction(sender._id, 'Transfer', req, `To: ${beneficiaryAccount}, Amount: ${amount}`);
        res.json({ message: 'Transfer successful.', balance: sender.balance });

    } catch (err) {
        res.status(500).json({ message: 'Error during transfer.' });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { from, to, filter } = req.query;
        let query = { userId: req.session.userId };

        if (filter) {
            const days = parseInt(filter);
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days);
            query.date = { $gte: dateLimit };
        } else if (from && to) {
            query.date = { $gte: new Date(from), $lte: new Date(to) };
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching transactions.' });
    }
};
