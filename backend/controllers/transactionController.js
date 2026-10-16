
const Transaction = require("../models/transactions");

const getTransactions = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = {};

    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({
          message: "Month must be in YYYY-MM format",
        });
      }

      const [year, monthNumber] = month.split("-").map(Number);

      const startDate = new Date(
        Date.UTC(year, monthNumber - 1, 1)
      );

      const endDate = new Date(
        Date.UTC(year, monthNumber, 1)
      );

      filter.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};


const createTransaction = async (req, res) => {
  try {
    const allowedFields = [
      "amount",
      "type",
      "category",
      "date",
      "paymentMethod",
      "note",
    ];

    const invalidFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: "Unexpected fields",
        fields: invalidFields,
      });
    }

    const {
      amount,
      type,
      category,
      date,
      paymentMethod,
      note,
    } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Type must be income or expense",
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (
      typeof paymentMethod !== "string" ||
      !paymentMethod.trim()
    ) {
      return res.status(400).json({
        message: "Payment method is required",
      });
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        message: "Date must use YYYY-MM-DD format",
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsedDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        message: "Invalid calendar date",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        message: "Note must be a string",
      });
    }

    const transaction = await Transaction.create({
      amount,
      type,
      category: category.trim(),
      date: parsedDate,
      paymentMethod: paymentMethod.trim(),
      note: note?.trim() ?? "",
    });

    return res.status(201).json(transaction);
  } catch (error) {
    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create transaction",
    });
  }
};


const updateTransaction = async (req, res) => {
  try {
    const allowedFields = [
      "amount",
      "type",
      "category",
      "date",
      "paymentMethod",
      "note",
    ];

    const keys = Object.keys(req.body);

    if (
      keys.length === 0 ||
      keys.some((key) => !allowedFields.includes(key))
    ) {
      return res.status(400).json({
        message: "Provide valid transaction fields to update",
      });
    }

    if (
      req.body.amount !== undefined &&
      (!Number.isFinite(req.body.amount) ||
        req.body.amount <= 0)
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    if (
      req.body.type !== undefined &&
      !["income", "expense"].includes(req.body.type)
    ) {
      return res.status(400).json({
        message: "Type must be income or expense",
      });
    }

    if (
      req.body.category !== undefined &&
      (typeof req.body.category !== "string" ||
        !req.body.category.trim())
    ) {
      return res.status(400).json({
        message: "Category cannot be empty",
      });
    }

    if (
      req.body.paymentMethod !== undefined &&
      (typeof req.body.paymentMethod !== "string" ||
        !req.body.paymentMethod.trim())
    ) {
      return res.status(400).json({
        message: "Payment method cannot be empty",
      });
    }

    if (req.body.note !== undefined &&
        typeof req.body.note !== "string") {
      return res.status(400).json({
        message: "Note must be a string",
      });
    }

    const updates = { ...req.body };

    if (updates.category !== undefined) {
      updates.category = updates.category.trim();
    }

    if (updates.paymentMethod !== undefined) {
      updates.paymentMethod = updates.paymentMethod.trim();
    }

    if (updates.note !== undefined) {
      updates.note = updates.note.trim();
    }

    if (updates.date !== undefined) {
      if (
        typeof updates.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)
      ) {
        return res.status(400).json({
          message: "Date must use YYYY-MM-DD format",
        });
      }

      const [year, month, day] = updates.date
        .split("-")
        .map(Number);

      const parsedDate = new Date(
        Date.UTC(year, month - 1, day)
      );

      if (
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
      ) {
        return res.status(400).json({
          message: "Invalid calendar date",
        });
      }

      updates.date = parsedDate;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update transaction",
    });
  }
};


const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      message: "Transaction deleted successfully",
      transaction,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    return res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
};


const getTransactionSummary = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        message: "Provide a valid month in YYYY-MM format",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const startDate = new Date(
      Date.UTC(year, monthNumber - 1, 1)
    );

    const endDate = new Date(
      Date.UTC(year, monthNumber, 1)
    );

    const summary = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      month,
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
    };

    for (const item of summary) {
      if (item._id === "income") {
        result.totalIncome = item.total;
        result.incomeCount = item.count;
      } else if (item._id === "expense") {
        result.totalExpenses = item.total;
        result.expenseCount = item.count;
      }
    }

    result.balance = result.totalIncome - result.totalExpenses;

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to calculate summary",
    });
  }
};


const getCategorySummary = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        message: "Provide a valid month in YYYY-MM format",
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);

    const startDate = new Date(
      Date.UTC(year, monthNumber - 1, 1)
    );

    const endDate = new Date(
      Date.UTC(year, monthNumber, 1)
    );

    const categories = await Transaction.aggregate([
      {
        $match: {
          type: "expense",
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1,
          count: 1,
        },
      },
    ]);

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to calculate category summary",
    });
  }
};


module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getCategorySummary,
};