const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getUserDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();
router.get("/", authMiddleware, getUserDashboard);
module.exports = router;
