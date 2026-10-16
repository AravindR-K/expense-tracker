
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getTransactions = (month) =>
  api.get(`/transactions?month=${month}`);

export const getSummary = (month) =>
  api.get(`/transactions/summary?month=${month}`);

export const getCategorySummary = (month) =>
  api.get(`/transactions/summary/categories?month=${month}`);

export const createTransaction = (data) =>
  api.post("/transactions", data);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`);
