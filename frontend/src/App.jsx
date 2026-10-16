
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarDays,
  ChartNoAxesCombined,
  Wallet,
  Search,
  Sun,
  Moon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ReceiptText,
  Menu,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  getTransactions,
  getSummary,
  deleteTransaction,
} from "./services/transactionService";
import TransactionModal from "./components/transactionModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import "./App.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Calendar", icon: CalendarDays },
  { label: "Statistics", icon: ChartNoAxesCombined },
  { label: "Accounts", icon: Wallet },
];

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const money = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

// Colour palette for the pie chart slices
const PIE_COLOURS = [
  "#171717", "#4a90d9", "#e05c5c", "#2cb67d", "#f5a623",
  "#9b59b6", "#1abc9c", "#e67e22", "#e74c3c", "#3498db",
];

export default function App() {
  const [month, setMonth] = useState(currentMonth);
  const [activePage, setActivePage] = useState("Overview");
  const [transactions, setTransactions] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const monthLabel = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionsResponse, summaryResponse] = await Promise.all([
        getTransactions(month),
        getSummary(month),
      ]);

      const transactionData = transactionsResponse.data;
      const list = Array.isArray(transactionData)
        ? transactionData
        : Array.isArray(transactionData?.transactions)
          ? transactionData.transactions
          : [];

      setTransactions(list);
      setSummary(summaryResponse.data || {});
    } catch (err) {
      console.error("Expense Tracker API error:", err);
      setError(
        err.response?.data?.message ||
          "Could not connect to the backend. Check that your server is running."
      );
      setTransactions([]);
      setSummary({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((item) =>
      [
        item.category,
        item.type,
        item.paymentMethod,
        item.note,
        item.amount,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [transactions, search]);

  // Category spending totals for Statistics page
  const categoryTotals = useMemo(() => {
    const totals = {};

    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const category = item.category || "Other";
        totals[category] = (totals[category] || 0) + Number(item.amount || 0);
      });

    return Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  // Calendar: group filtered transactions by UTC date
  const transactionsByDate = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((item) => {
      const key = item.date.slice(0, 10); // "2024-10-16"
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    // Return as sorted array of [dateKey, items] pairs, newest first
    return Object.entries(groups).sort(([a], [b]) => (b > a ? 1 : -1));
  }, [filteredTransactions]);

  // Account summaries grouped by paymentMethod
  const accountSummaries = useMemo(() => {
    const map = {};
    transactions.forEach((item) => {
      const method = item.paymentMethod || "Other";
      if (!map[method]) map[method] = { income: 0, expense: 0, count: 0 };
      if (item.type === "income") map[method].income += Number(item.amount || 0);
      else map[method].expense += Number(item.amount || 0);
      map[method].count += 1;
    });
    return Object.entries(map)
      .map(([method, data]) => ({
        method,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  const changeMonth = (direction) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + direction, 1);
    setMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleEdit = (item) => {
    setEditTransaction(item);
    setShowTransactionModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete transaction.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setShowTransactionModal(false);
    setEditTransaction(null);
  };

  const pageTitle =
    activePage === "Overview" ? "Financial overview" : activePage;

  return (
    <div className={`app-shell ${darkMode ? "dark-theme" : "light-theme"}`}>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Wallet size={21} />
          </div>
          <div>
            <strong>Monetra</strong>
            <span>PERSONAL FINANCE</span>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="side-navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Transactions" && transactions.length > 0 && (
                <span className="nav-count">{transactions.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <ChartNoAxesCombined size={19} />
            </div>
            <strong>Small steps add up.</strong>
            <p>Keep track of where your money goes.</p>
          </div>
          <div className="profile">
            <div className="profile-avatar">ME</div>
            <div className="profile-copy">
              <strong>My finances</strong>
              <span>Personal account</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="top-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions..."
                aria-label="Search transactions"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <button
              className="theme-toggle"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">YOUR MONEY, AT A GLANCE</p>
              <h1>{pageTitle}</h1>
              <p className="page-subtitle">
                Track your income, manage expenses, and understand your spending.
              </p>
            </div>

            <button className="primary-button" onClick={() => setShowTransactionModal(true)}>
              <Plus size={18} />
              Add transaction
            </button>
          </section>

          <section className="month-toolbar">
            <div>
              <span className="field-label">REPORTING PERIOD</span>
              <div className="month-control">
                <button
                  className="icon-button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <strong>{monthLabel}</strong>
                <button
                  className="icon-button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="month-actions">
              <input
                aria-label="Select reporting month"
                type="month"
                value={month}
                onChange={(event) => event.target.value && setMonth(event.target.value)}
              />
              <button
                className="secondary-button"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                Refresh
              </button>
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={loadData}>Try again</button>
            </div>
          )}

          <section className="summary-grid">
            <article className="summary-card">
              <div className="summary-card-top">
                <span>Total income</span>
                <div className="metric-icon income-icon">
                  <ArrowDownRight size={20} />
                </div>
              </div>
              <h2>{money(summary.totalIncome)}</h2>
              <p>Money received this month</p>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <span>Total expenses</span>
                <div className="metric-icon expense-icon">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <h2>{money(summary.totalExpenses)}</h2>
              <p>Money spent this month</p>
            </article>

            <article className="summary-card balance-card">
              <div className="summary-card-top">
                <span>Net balance</span>
                <div className="metric-icon balance-icon">
                  <Wallet size={19} />
                </div>
              </div>
              <h2>{money(summary.balance)}</h2>
              <p>Income minus expenses</p>
            </article>
          </section>

          {/* ── Calendar page ── */}
          {activePage === "Calendar" ? (
            <section className="content-panel">
              <PanelHeading title="Calendar" subtitle={`Transactions recorded in ${monthLabel}`} />
              {loading ? (
                <div className="loading-state">Loading transactions...</div>
              ) : transactionsByDate.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="calendar-list">
                  {transactionsByDate.map(([dateKey, items]) => (
                    <div key={dateKey} className="calendar-day-group">
                      <div className="calendar-day-label">
                        {new Date(dateKey + "T00:00:00Z").toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          timeZone: "UTC",
                        })}
                      </div>
                      {items.map((item) => (
                        <TransactionRow
                          key={item._id}
                          item={item}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          deletingId={deletingId}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>

          /* ── Statistics page ── */
          ) : activePage === "Statistics" ? (
            <section className="content-panel">
              <PanelHeading
                title="Spending by category"
                subtitle="Your highest expense categories for the selected month"
              />
              {loading ? (
                <div className="loading-state">Loading statistics...</div>
              ) : categoryTotals.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="stats-layout">
                  {/* Pie chart */}
                  <div className="pie-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          dataKey="total"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={55}
                          paddingAngle={3}
                        >
                          {categoryTotals.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={PIE_COLOURS[index % PIE_COLOURS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => money(value)}
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 7,
                            border: "1px solid #e8e8e8",
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span style={{ fontSize: 11 }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Progress bars */}
                  <div className="category-list">
                    {categoryTotals.map(({ category, total }) => {
                      const maximum = categoryTotals[0].total || 1;
                      return (
                        <div className="category-item" key={category}>
                          <div className="category-item-label">
                            <span>{category}</span>
                            <strong>{money(total)}</strong>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${(total / maximum) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

          /* ── Accounts page ── */
          ) : activePage === "Accounts" ? (
            <section className="content-panel">
              <PanelHeading title="Accounts" subtitle="Your transactions grouped by payment method" />
              {loading ? (
                <div className="loading-state">Loading accounts...</div>
              ) : accountSummaries.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="accounts-grid">
                  {accountSummaries.map(({ method, income, expense, balance, count }) => (
                    <div className="account-item" key={method}>
                      <div className="account-symbol"><Wallet size={20} /></div>
                      <div className="account-details">
                        <strong>{method}</strong>
                        <span className="account-meta">{count} transaction{count !== 1 ? "s" : ""}</span>
                        <div className="account-amounts">
                          <span className="positive">+{money(income)}</span>
                          <span className="negative">−{money(expense)}</span>
                        </div>
                        <span className={`account-balance ${balance >= 0 ? "positive" : "negative"}`}>
                          Net: {money(balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          /* ── Overview / Transactions page ── */
          ) : (
            <section className="content-panel">
              <PanelHeading
                title={activePage === "Overview" ? "Recent transactions" : "All transactions"}
                subtitle="A clear view of money moving in and out"
                action={
                  activePage === "Overview" ? (
                    <button className="text-button" onClick={() => setActivePage("Transactions")}>
                      View all <span>→</span>
                    </button>
                  ) : null
                }
              />

              <div className="table-wrap">
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th>DATE</th>
                      <th>PAYMENT METHOD</th>
                      <th>TYPE</th>
                      <th className="amount-column">AMOUNT</th>
                      <th className="actions-column">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, activePage === "Overview" ? 8 : undefined).map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="transaction-name">
                            <div className={`transaction-symbol ${item.type === "income" ? "symbol-income" : "symbol-expense"}`}>
                              {item.type === "income" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                              <strong>{item.category}</strong>
                              <span>{item.note || "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(item.date)}</td>
                        <td><span className="payment-pill">{item.paymentMethod || "—"}</span></td>
                        <td><span className={`type-label ${item.type === "income" ? "type-income" : "type-expense"}`}>{item.type}</span></td>
                        <td className={`amount-column amount ${item.type === "income" ? "positive" : "negative"}`}>
                          {item.type === "income" ? "+" : "−"}{money(item.amount)}
                        </td>
                        <td className="actions-column">
                          <div className="row-actions">
                            <button
                              className="icon-button action-edit"
                              title="Edit transaction"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-button action-delete"
                              title="Delete transaction"
                              disabled={deletingId === item._id}
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredTransactions.length === 0 && <EmptyState />}
                {loading && <div className="loading-state">Loading transactions...</div>}
              </div>

              <div className="table-footer">
                <span>
                  Showing {Math.min(filteredTransactions.length, activePage === "Overview" ? 8 : filteredTransactions.length)} of {filteredTransactions.length} transactions
                </span>
                <span>{monthLabel}</span>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>Monetra · Personal finance dashboard</span>
            <span>Reporting period: {monthLabel}</span>
          </footer>
        </div>

        {showTransactionModal && (
          <TransactionModal
            onClose={handleModalClose}
            onSuccess={loadData}
            editData={editTransaction}
          />
        )}
      </main>
    </div>
  );
}

function PanelHeading({ title, subtitle, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function TransactionRow({ item, onEdit, onDelete, deletingId }) {
  return (
    <div className="calendar-transaction">
      <div className={`transaction-symbol ${item.type === "income" ? "symbol-income" : "symbol-expense"}`}>
        {item.type === "income" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
      </div>
      <div className="calendar-transaction-copy">
        <strong>{item.category}</strong>
        <span>{item.paymentMethod}{item.note ? ` · ${item.note}` : ""}</span>
      </div>
      <strong className={`amount ${item.type === "income" ? "positive" : "negative"}`}>
        {item.type === "income" ? "+" : "−"}{money(item.amount)}
      </strong>
      <div className="row-actions">
        <button
          className="icon-button action-edit"
          title="Edit transaction"
          onClick={() => onEdit(item)}
        >
          <Pencil size={14} />
        </button>
        <button
          className="icon-button action-delete"
          title="Delete transaction"
          disabled={deletingId === item._id}
          onClick={() => onDelete(item._id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ loading }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><ReceiptText size={25} /></div>
      <strong>{loading ? "Loading your transactions" : "No transactions found"}</strong>
      <p>{loading ? "Please wait while we fetch your data." : "Try another search or add a transaction to get started."}</p>
    </div>
  );
}
