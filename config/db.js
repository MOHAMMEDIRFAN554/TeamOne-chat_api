const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const dbUri = process.env.MONGO_URI;

        if (!dbUri && process.env.NODE_ENV === 'production') {
            console.error('CRITICAL_FAILURE: MONGO_URI is missing in production environment.');
            process.exit(1);
        }

        const conn = await mongoose.connect(dbUri || 'mongodb://localhost:27017/office-chat');

        console.log(`Neural Link Established: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Neural Link Failure: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
