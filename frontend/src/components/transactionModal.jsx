import { useState, useEffect } from "react";
import { createTransaction, updateTransaction } from "../services/transactionService";

export default function TransactionModal({ editData, onClose, onSuccess }) {

  const isEditing = Boolean(editData);

  // Form state holding all input values
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10), 
    paymentMethod: "UPI",
    note: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        type: editData.type,
        amount: editData.amount,
        category: editData.category,
        date: editData.date ? editData.date.slice(0, 10) : "",
        paymentMethod: editData.paymentMethod,
        note: editData.note || "",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setFormData({
        ...formData,
        type: value,
        category: value === "income" ? "Salary" : "Food",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrorMessage("Please enter an amount greater than 0");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        note: formData.note,
      };

      if (isEditing) {
        await updateTransaction(editData._id, payload);
      } else {
        await createTransaction(payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage(error.response?.data?.message || "Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{isEditing ? "Edit Transaction" : "Add Transaction"}</h2>

        {errorMessage && <p className="error-alert">{errorMessage}</p>}

        <form onSubmit={handleSubmit}>
          {/* Transaction Type */}
          <div className="form-group">
            <label>Type:</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>Amount (₹):</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              placeholder="e.g. 500"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category:</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              {formData.type === "expense" ? (
                <>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Business">Business</option>
                  <option value="Investment">Investment</option>
                  <option value="Gift">Gift</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label>Payment Method:</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div className="form-group">
            <label>Note (Optional):</label>
            <input
              type="text"
              name="note"
              placeholder="e.g. Pizza with friends"
              value={formData.note}
              onChange={handleChange}
            />
          </div>

          {/* Form Actions */}
          <div className="modal-buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
