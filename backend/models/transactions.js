const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than zero"],
        },

        type: {
            type: String,
            required: [true, "Transaction type is required"],
            enum: ["income", "expense"],
        },

        category: {
            type: String,
            required: [true, "Category is required"],
        },

        date: {
            type: Date,
            required: [true, "Transaction date is required"],
        },

        paymentMethod: {
            type: String,
            required: [true, "Payment method is required"],
        },

        note: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);