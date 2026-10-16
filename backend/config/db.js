const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
    } catch (error) {
        console.log("Mongo DB connection failed:", error.message);
        process.exit();
    }
};

module.exports = connectDB;