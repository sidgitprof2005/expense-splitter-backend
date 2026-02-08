import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import expenseRoutes from "./routes/expenseRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(err));

// Routes
app.get("/", (req, res) => {
  res.send("Expense Splitter Backend Running 🚀");
});

app.use("/api/expenses", expenseRoutes);

app.listen(5000, () => console.log("Backend running on port 5000"));