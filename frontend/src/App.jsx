import { useState, useEffect } from "react";
import {
  getTransactions,
  getSummary,
  deleteTransaction,
} from "./services/transactionService";
import TransactionModal from "./components/transactionModal";
import "./App.css";

export default function App() {
  const getCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [transactionsResponse, summaryResponse] = await Promise.all([
        getTransactions(selectedMonth),
        getSummary(selectedMonth),
      ]);

      setTransactions(transactionsResponse.data || []);
      setSummary(
        summaryResponse.data || { totalIncome: 0, totalExpenses: 0, balance: 0 }
      );
    } catch (error) {
      console.error("API error:", error);
      setErrorMessage("Could not connect to backend server. Make sure it is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) return;

    try {
      await deleteTransaction(id);
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete transaction.");
    }
  };

  const handleOpenAddModal = () => {
    setCurrentTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setCurrentTransaction(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTransaction(null);
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    fetchData();
  };

  const formatMoney = (amount) => {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="page-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-title">Expense Tracker</div>
          <button className="nav-btn" onClick={handleOpenAddModal}>
            Add transaction
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Editorial Heading */}
        <div className="editorial-header">
          <h1>Track your money simply.</h1>
          <p className="editorial-subtitle">
            View monthly summaries and manage daily income and expenses.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="controls-row">
          <div className="month-input-wrapper">
            <span className="input-prefix">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="month-picker"
            />
          </div>
          <button className="simple-btn" onClick={fetchData} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <hr className="section-divider" />

        {/* Summary Numbers */}
        <div className="summary-overview">
          <div className="summary-stat">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatMoney(summary.totalIncome)}</span>
          </div>
          <div className="stat-separator" />
          <div className="summary-stat">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatMoney(summary.totalExpenses)}</span>
          </div>
          <div className="stat-separator" />
          <div className="summary-stat">
            <span className="stat-label">Net Balance</span>
            <span className="stat-value">{formatMoney(summary.balance)}</span>
          </div>
        </div>

        <hr className="section-divider" />

        {/* Error notification if any */}
        {errorMessage && <div className="simple-alert">{errorMessage}</div>}

        {/* Transactions Table sitting directly on the page */}
        <div className="table-section">
          <h2>All Transactions</h2>

          {isLoading ? (
            <p className="empty-notice">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="empty-notice">No transactions recorded for this month.</p>
          ) : (
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th className="th-amount">Amount</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item._id}>
                    <td className="td-category">{item.category}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.paymentMethod}</td>
                    <td className="td-type">{item.type}</td>
                    <td className="td-note">{item.note || "—"}</td>
                    <td className="td-amount">
                      {item.type === "income" ? "+" : "−"}
                      {formatMoney(item.amount)}
                    </td>
                    <td className="td-actions">
                      <button
                        className="table-btn"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="table-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <TransactionModal
          editData={currentTransaction}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
