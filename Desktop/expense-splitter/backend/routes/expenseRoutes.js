import express from "express";
import Expense from "../models/Expense.js";

const router = express.Router();

// Get all expenses
router.get("/", async (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses);
});

// Add new expense
router.post("/", async (req, res) => {
  const newExpense = new Expense(req.body);
  await newExpense.save();
  res.json(newExpense);
});

// Clear all
router.delete("/", async (req, res) => {
  await Expense.deleteMany({});
  res.json({ message: "All expenses cleared" });
});

export default router;
