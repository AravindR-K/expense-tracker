import { useEffect, useState } from "react";
import { getTransactions, getSummary, deleteTransaction } from "./services/transactionService";
import TransactionModal from "./components/TransactionModal";
import "./App.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function App() {
  const [month, setMonth] = useState(thisMonth);
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null = closed, "add" = add, object = edit

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([getTransactions(month), getSummary(month)]);
      setList(Array.isArray(a.data) ? a.data : []);
      setSummary(b.data || {});
    } catch {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      load();
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <div className="page">
      {/* Top bar */}
      <div className="topbar">
        <h1>Expense Tracker</h1>
        <button className="btn-add" onClick={() => setModal("add")}>+ Add</button>
      </div>

      {/* Controls */}
      <div className="controls">
        <label>
          Month:&nbsp;
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <button className="btn-refresh" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Summary */}
      <div className="summary">
        <div className="scard green">
          <div className="scard-label">Income</div>
          <div className="scard-val">{fmt(summary.totalIncome)}</div>
        </div>
        <div className="scard red">
          <div className="scard-label">Expenses</div>
          <div className="scard-val">{fmt(summary.totalExpenses)}</div>
        </div>
        <div className="scard blue">
          <div className="scard-label">Balance</div>
          <div className="scard-val">{fmt(summary.balance)}</div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Table */}
      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Type</th>
              <th>Note</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && list.length === 0 && (
              <tr><td colSpan="7" className="empty">No transactions for this month.</td></tr>
            )}
            {list.map((t) => (
              <tr key={t._id}>
                <td>{t.category}</td>
                <td>{fmtDate(t.date)}</td>
                <td>{t.paymentMethod}</td>
                <td>
                  <span className={t.type === "income" ? "tag-income" : "tag-expense"}>{t.type}</span>
                </td>
                <td className="note">{t.note || "—"}</td>
                <td className={t.type === "income" ? "amt-pos" : "amt-neg"}>
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </td>
                <td>
                  <button className="btn-edit" onClick={() => setModal(t)}>Edit</button>
                  <button className="btn-del" onClick={() => handleDelete(t._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <TransactionModal
          editData={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
