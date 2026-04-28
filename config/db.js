const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Database Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
