require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
}));
app.use(express.json());
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();