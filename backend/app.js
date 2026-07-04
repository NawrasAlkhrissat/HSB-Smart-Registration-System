require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const connectDB = require("./src/config/db");
const adminRoutes = require("./src/routes/adminRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const authRoutes = require("./src/routes/authRoutes"); 
const { startCronJobs } = require("./src/services/cronService");
const cors = require('cors');

const PORT = 3000;
const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
connectDB();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use('/api/auth', authRoutes);

startCronJobs();


app.get("/", (req, res) => {
  try {
    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("app runnig port is : " + PORT);
});
