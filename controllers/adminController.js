const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemLog = require('../models/SystemLog');
const CheckbookRequest = require('../models/CheckbookRequest');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).select('-password -securityAnswer');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users.' });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }).populate('userId', 'name email');
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching transactions.' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await SystemLog.find().sort({ timestamp: -1 }).populate('userId', 'name email');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching logs.' });
    }
};

exports.updateCheckbookStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await CheckbookRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found.' });

        request.status = status;
        if (status === 'Approved') request.approvedDate = new Date();
        
        await request.save();
        res.json({ message: `Checkbook request ${status}.` });
    } catch (err) {
        res.status(500).json({ message: 'Error updating status.' });
    }
};

exports.getAllCheckbookRequests = async (req, res) => {
    try {
        const requests = await CheckbookRequest.find().sort({ requestDate: -1 }).populate('userId', 'name email');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching checkbook requests.' });
    }
};
