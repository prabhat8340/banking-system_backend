const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logAction } = require('../middleware/auth');

exports.register = async (req, res) => {
    try {
        const { name, email, phone, address, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const user = new User({
            name, email, phone, address, password, securityQuestion, securityAnswer
        });

        await user.save();
        await logAction(user._id, 'Registration', req, `User registered with email: ${email}`);

        res.status(201).json({ message: 'Registration successful. Please login.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(403).json({ message: `Account locked. Try again in ${remaining} minutes.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedAttempts += 1;
            if (user.failedAttempts >= 3) {
                user.lockUntil = Date.now() + 5 * 60 * 1000; // 5 mins
                user.failedAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Reset failed attempts on success
        user.failedAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        await user.save();

        req.session.userId = user._id.toString();
        req.session.isAdmin = user.isAdmin;
        req.session.lastActivity = Date.now();

        await logAction(user._id, 'Login', req);

        res.json({ 
            message: 'Login successful', 
            user: { name: user.name, isAdmin: user.isAdmin } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login.' });
    }
};

exports.logout = async (req, res) => {
    if (req.session.userId) {
        await logAction(req.session.userId, 'Logout', req);
    }
    req.session.destroy();
    res.json({ message: 'Logged out successfully.' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password -securityAnswer');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { email, phone, address } = req.body;
        const user = await User.findById(req.session.userId);
        
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();
        await logAction(user._id, 'Profile Update', req);
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password incorrect.' });
        }

        user.password = newPassword;
        await user.save();
        await logAction(user._id, 'Password Change', req);
        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error changing password.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(securityAnswer, user.securityAnswer);
        if (!isMatch) {
            return res.status(400).json({ message: 'Security answer incorrect.' });
        }

        user.password = newPassword;
        await user.save();
        await logAction(user._id, 'Forgot Password Reset', req);
        res.json({ message: 'Password reset successful. Please login.' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password.' });
    }
};
