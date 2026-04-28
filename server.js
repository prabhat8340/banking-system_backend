require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'banking_portal_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
}));

// Admin Seeding Function
const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@bank.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const admin = new User({
                name: 'System Admin',
                email: adminEmail,
                phone: '0000000000',
                address: 'Bank Headquarters',
                password: 'Admin@123',
                securityQuestion: 'System Role',
                securityAnswer: 'Administrator',
                isAdmin: true,
                balance: 1000000
            });
            await admin.save();
            console.log('Admin user seeded successfully.');
        }
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    }
};

// Seed admin on start
seedAdmin();

// Routes
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

// Catch-all for HTML files (optional since static middleware handles it, 
// but good for direct route access)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html')));
app.get('/admin-panel', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'admin.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Automatically open browser only in development (Windows)
    if (process.env.NODE_ENV !== 'production') {
        try {
            const { exec } = require('child_process');
            exec(`start http://localhost:${PORT}`);
        } catch (err) {
            console.log('Could not open browser automatically.');
        }
    }
});
