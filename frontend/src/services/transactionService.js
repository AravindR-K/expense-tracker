import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getTransactions = (month) => {
  return api.get(`/transactions?month=${month}`);
};

export const getSummary = (month) => {
  return api.get(`/transactions/summary?month=${month}`);
};

export const createTransaction = (data) => {
  return api.post("/transactions", data);
};

export const updateTransaction = (id, data) => {
  return api.put(`/transactions/${id}`, data);
};

export const deleteTransaction = (id) => {
  return api.delete(`/transactions/${id}`);
};
