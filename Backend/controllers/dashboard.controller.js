const mongoose = require("mongoose");
const Project = require("../Models/project.model");
const Task = require("../Models/task.model");

const getProjectDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const project = await Project.findById(id).select("owner members");
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        const isMember = project.members.some((item) => item.user.toString() === req.user.id);
        if (project.owner.toString() !== req.user.id && !isMember) return res.status(403).json({ success: false, message: "Access denied" });
        const [stats] = await Task.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(id) } },
            { $group: {
                _id: null, totalTasks: { $sum: 1 },
                todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                lowPriority: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
                mediumPriority: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                overdueTasks: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "completed"] }] }, 1, 0] } }
            } }
        ]);
        const dashboard = stats || {};
        return res.status(200).json({ success: true, dashboard: { totalTasks: dashboard.totalTasks || 0, todo: dashboard.todo || 0, inProgress: dashboard.inProgress || 0, completed: dashboard.completed || 0, lowPriority: dashboard.lowPriority || 0, mediumPriority: dashboard.mediumPriority || 0, highPriority: dashboard.highPriority || 0, overdueTasks: dashboard.overdueTasks || 0, totalMembers: project.members.length } });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getUserDashboard = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const [totalProjects, ownedProjects, memberProjects, taskStats] = await Promise.all([
            Project.countDocuments({ $or: [{ owner: userId }, { "members.user": userId }] }),
            Project.countDocuments({ owner: userId }),
            Project.countDocuments({ owner: { $ne: userId }, "members.user": userId }),
            Task.aggregate([{ $match: { assignedTo: userId } }, { $group: {
                _id: null, totalTasks: { $sum: 1 },
                todoTasks: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
                inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                overdueTasks: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "completed"] }] }, 1, 0] } }
            } }])
        ]);
        const stats = taskStats[0] || {};
        return res.status(200).json({ success: true, dashboard: { totalProjects, ownedProjects, memberProjects, totalTasks: stats.totalTasks || 0, todoTasks: stats.todoTasks || 0, inProgressTasks: stats.inProgressTasks || 0, completedTasks: stats.completedTasks || 0, overdueTasks: stats.overdueTasks || 0 } });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getProjectDashboard, getUserDashboard };
