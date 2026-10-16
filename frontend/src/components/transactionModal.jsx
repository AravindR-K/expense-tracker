import { useState } from "react";
import { createTransaction, updateTransaction } from "../services/transactionService";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CATEGORIES = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"],
  income:  ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"],
};

const PAYMENTS = ["UPI", "Cash", "Debit Card", "Credit Card", "Bank Transfer", "Other"];

export default function TransactionModal({ editData, onClose, onSuccess }) {
  const isEdit = Boolean(editData);

  const [type,    setType]    = useState(isEdit ? editData.type          : "expense");
  const [amount,  setAmount]  = useState(isEdit ? String(editData.amount): "");
  const [cat,     setCat]     = useState(isEdit ? editData.category      : "Food");
  const [date,    setDate]    = useState(isEdit ? editData.date.slice(0, 10) : today());
  const [pay,     setPay]     = useState(isEdit ? editData.paymentMethod  : "UPI");
  const [note,    setNote]    = useState(isEdit ? (editData.note || "")   : "");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const switchType = (t) => {
    setType(t);
    setCat(t === "income" ? "Salary" : "Food");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }

    setSaving(true);
    try {
      const payload = { type, amount: Number(amount), category: cat, date, paymentMethod: pay, note };
      isEdit ? await updateTransaction(editData._id, payload) : await createTransaction(payload);
      onSuccess();
    } catch (ex) {
      setErr(ex.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal">
        <h2>{isEdit ? "Edit Transaction" : "Add Transaction"}</h2>

        <form onSubmit={submit}>
          {/* Type */}
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => switchType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Amount */}
          <div className="field">
            <label>Amount (₹)</label>
            <input type="number" min="0.01" step="0.01" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          {/* Category + Date */}
          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES[type].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Payment */}
          <div className="field">
            <label>Payment Method</label>
            <select value={pay} onChange={(e) => setPay(e.target.value)}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Note */}
          <div className="field">
            <label>Note (optional)</label>
            <input type="text" placeholder="e.g. Lunch with friends" maxLength={200}
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {err && <div className="form-err">{err}</div>}

          <div className="modal-btns">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
