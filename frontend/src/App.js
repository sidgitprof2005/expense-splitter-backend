import React, { useState, useEffect } from "react";
import AddExpense from "./components/AddExpense";
import ExpenseList from "./components/ExpenseList";
import BalanceSheet from "./components/BalanceSheet";
import "./App.css";

function App() {
  const users = [
    { id: 1, name: "Siddharth" },
    { id: 2, name: "Rohan" },
    { id: 3, name: "Priya" },
  ];

  const [expenses, setExpenses] = useState([]);

  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  useEffect(() => {
    fetch(`${API_URL}/expenses`)
      .then((res) => res.json())
      .then((data) => setExpenses(data))
      .catch((err) => console.error("Error fetching expenses:", err));
  }, [API_URL]);

  const addExpense = async (expense) => {
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      const newExpense = await res.json();
      setExpenses((prev) => [...prev, newExpense]);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const clearExpenses = async () => {
    if (window.confirm("Are you sure you want to clear all expenses?")) {
      try {
        await fetch(`${API_URL}/expenses`, { method: "DELETE" });
        setExpenses([]);
      } catch (error) {
        console.error("Error clearing expenses:", error);
      }
    }
  };

  const sendReminder = (user, amount) => {
    alert(`📩 Reminder sent to ${user} to pay ₹${amount.toFixed(2)}!`);
  };

  return (
    <div className="App gradient-bg animated-container">
      <h1 className="app-title">💸 Expense Splitter</h1>
      <button className="clear-btn" onClick={clearExpenses}>
        Clear All Expenses
      </button>
      <div className="card fade-in">
        <AddExpense users={users} addExpense={addExpense} />
      </div>
      <div className="card fade-in delay-1">
        <ExpenseList expenses={expenses} />
      </div>
      <div className="card fade-in delay-2">
        <BalanceSheet
          users={users}
          expenses={expenses}
          onReminder={sendReminder}
        />
      </div>
    </div>
  );
}

export default App;
