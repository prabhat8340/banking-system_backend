const SystemLog = require('../models/SystemLog');

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

const sessionTimeout = (req, res, next) => {
    if (req.session.userId) {
        const now = Date.now();
        const lastActivity = req.session.lastActivity || now;
        const timeout = 15 * 60 * 1000; // 15 minutes

        if (now - lastActivity > timeout) {
            req.session.destroy();
            return res.status(401).json({ message: 'Session expired due to inactivity.' });
        }
        req.session.lastActivity = now;
    }
    next();
};

const logAction = async (userId, action, req, details = '') => {
    try {
        await SystemLog.create({
            userId,
            action,
            ip: req.ip,
            details,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Logging Error:', err);
    }
};

module.exports = { requireAuth, requireAdmin, sessionTimeout, logAction };
