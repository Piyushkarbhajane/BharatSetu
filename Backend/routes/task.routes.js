const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
	createTask, getTasksByProject, getFilteredTasksByProject, getTaskById,
	updateTask, deleteTask, updateTaskStatus, getMyTasks, getMyProjectTasks
} = require("../controllers/task.controller");

const router = express.Router();
router.post("/create-task", authMiddleware, createTask);
router.get("/my-tasks", authMiddleware, getMyTasks);
router.get("/my-project-tasks", authMiddleware, getMyProjectTasks);
router.get("/project/:projectId/filter", authMiddleware, getFilteredTasksByProject);
router.get("/project/:projectId", authMiddleware, getTasksByProject);
router.get("/:id", authMiddleware, getTaskById);
router.put("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.patch("/:id/status", authMiddleware, updateTaskStatus);

module.exports = router;