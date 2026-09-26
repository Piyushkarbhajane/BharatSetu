const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const projectRoutes = require("./routes/project.route");
const taskRoutes = require("./routes/task.routes");
const dashboardRoutes = require("./routes/dashboard.route");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// ==============================
// Middleware
// ==============================

app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true
    })
);

// ==============================
// Routes
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ==============================
// Static Files
// ==============================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==============================
// Test Route
// ==============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "BharatSetu Backend is running!"
    });
});

// ==============================
// Error Middleware
// ==============================

app.use(errorMiddleware);

// ==============================
// Database Connection
// ==============================

connectDB().catch((error) => {
    console.error("MongoDB connection failed:", error.message);
});

// ==============================
// Export App
// ==============================

module.exports = app;
