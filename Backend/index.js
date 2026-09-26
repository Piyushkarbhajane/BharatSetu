const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const projectRoutes = require("./routes/project.route");
const errorMiddleware =
    require("./middleware/error.middleware");
const taskroutes=require("./routes/task.routes");
const dashboardRoutes = require("./routes/dashboard.route");

const app = express();


// ==============================
// Middleware
// ==============================

app.use(express.json());
app.use(cors());


// ==============================
// Routes
// ==============================

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks",taskroutes);
app.use("/api/dashboard", dashboardRoutes);


// ==============================
// Static Files
// ==============================
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ==============================
// Test Route
// ==============================

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use(errorMiddleware);


// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 7000;

const startServer = async () => {
    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
};

startServer();