
import { useState } from "react";
import { X } from "lucide-react";
import { createTransaction, updateTransaction } from "../services/transactionService";

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Derive a YYYY-MM-DD string from an ISO date string, keeping it UTC so the
// value matches what the backend stored.
const toDateInput = (isoString) => {
  if (!isoString) return today();
  return isoString.slice(0, 10); // "2024-10-16T00:00:00.000Z" → "2024-10-16"
};

export default function TransactionModal({ onClose, onSuccess, editData }) {
  const isEditing = Boolean(editData);

  const [form, setForm] = useState({
    amount: isEditing ? String(editData.amount) : "",
    type: isEditing ? editData.type : "expense",
    category: isEditing ? editData.category : "Food",
    date: isEditing ? toDateInput(editData.date) : today(),
    paymentMethod: isEditing ? editData.paymentMethod : "UPI",
    note: isEditing ? (editData.note || "") : "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  // When the type switches, reset category to the first option for the new type.
  const switchType = (type) => {
    const defaultCategory =
      type === "income" ? "Salary" : "Food";
    setForm((prev) => ({ ...prev, type, category: defaultCategory }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!form.category.trim() || !form.paymentMethod.trim() || !form.date) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (isEditing) {
        await updateTransaction(editData._id, payload);
      } else {
        await createTransaction(payload);
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the transaction. Check your backend and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">YOUR FINANCES</p>
            <h2 id="transaction-modal-title">
              {isEditing ? "Edit transaction" : "Add transaction"}
            </h2>
            <p>Record money coming in or going out.</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="form-label">Transaction type</label>
          <div className="type-switch">
            <button
              type="button"
              className={form.type === "expense" ? "selected expense-selected" : ""}
              onClick={() => switchType("expense")}
            >
              Expense
            </button>
            <button
              type="button"
              className={form.type === "income" ? "selected income-selected" : ""}
              onClick={() => switchType("income")}
            >
              Income
            </button>
          </div>

          <label className="form-label" htmlFor="transaction-amount">
            Amount (₹)
          </label>
          <input
            id="transaction-amount"
            className="form-input amount-input"
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={updateField}
            required
          />

          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="transaction-category">
                Category
              </label>
              <select
                id="transaction-category"
                className="form-input"
                name="category"
                value={form.category}
                onChange={updateField}
                required
              >
                {(
                  form.type === "income"
                    ? ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"]
                    : ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Travel", "Other"]
                ).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="transaction-date">
                Date
              </label>
              <input
                id="transaction-date"
                className="form-input"
                type="date"
                name="date"
                value={form.date}
                onChange={updateField}
                required
              />
            </div>
          </div>

          <label className="form-label" htmlFor="transaction-payment">
            Payment method
          </label>
          <select
            id="transaction-payment"
            className="form-input"
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={updateField}
            required
          >
            {["UPI", "Cash", "Debit Card", "Credit Card", "Bank Transfer", "Other"].map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>

          <label className="form-label" htmlFor="transaction-note">
            Note <span className="optional-label">(optional)</span>
          </label>
          <input
            id="transaction-note"
            className="form-input"
            type="text"
            name="note"
            placeholder="e.g. Lunch with friends"
            value={form.note}
            onChange={updateField}
            maxLength={300}
          />

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving
                ? isEditing ? "Updating..." : "Saving..."
                : isEditing ? "Update transaction" : "Save transaction"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
