const mongoose = require("mongoose");
const Task = require("../Models/task.model");
const Project = require("../Models/project.model");
const User = require("../Models/user.model");

const SORT_FIELDS = ["createdAt", "updatedAt", "dueDate", "priority", "status"];
const STATUS = ["todo", "in-progress", "completed"];
const PRIORITY = ["low", "medium", "high"];
const MAX_LIMIT = 100;

const invalidId = (value) => !mongoose.Types.ObjectId.isValid(value);
const getPaging = (query) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1 || limit > MAX_LIMIT) return null;
    return { page, limit, skip: (page - 1) * limit };
};
const getSort = (query) => ({ [SORT_FIELDS.includes(query.sortBy) ? query.sortBy : "createdAt"]: query.sortOrder === "asc" ? 1 : -1 });
const getAccess = (project, userId) => {
    const member = project.members.find((item) => item.user.toString() === userId);
    return { owner: project.owner.toString() === userId, member: Boolean(member), manager: member?.role === "manager" };
};
const populate = (query) => query.populate("assignedTo", "name email").populate("createdBy", "name email").populate("project", "name");
const loadTask = async (id) => {
    const task = await Task.findById(id);
    return task ? { task, project: await Project.findById(task.project) } : { task: null, project: null };
};
const listTasks = async (req, res, query) => {
    const paging = getPaging(req.query);
    if (!paging) return res.status(400).json({ success: false, message: "Invalid page or limit" });
    const [totalTasks, tasks] = await Promise.all([
        Task.countDocuments(query),
        populate(Task.find(query)).sort(getSort(req.query)).skip(paging.skip).limit(paging.limit)
    ]);
    return res.status(200).json({ success: true, page: paging.page, limit: paging.limit, totalTasks, totalPages: Math.ceil(totalTasks / paging.limit), count: tasks.length, tasks });
};

const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, projectId, assignedTo } = req.body;
        if (!title || !projectId || !assignedTo || !dueDate) return res.status(400).json({ success: false, message: "title, projectId, assignedTo and dueDate are required" });
        if (invalidId(projectId) || invalidId(assignedTo)) return res.status(400).json({ success: false, message: "Invalid ID" });
        if (priority && !PRIORITY.includes(priority)) return res.status(400).json({ success: false, message: "Invalid priority" });
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.member) return res.status(403).json({ success: false, message: "Access denied" });
        const user = await User.findById(assignedTo).select("_id");
        if (!user) return res.status(404).json({ success: false, message: "Assigned user not found" });
        const allowed = project.owner.toString() === assignedTo || project.members.some((member) => member.user.toString() === assignedTo);
        if (!allowed) return res.status(400).json({ success: false, message: "Assigned user is not a project member" });
        const task = await Task.create({ title, description, project: projectId, assignedTo, createdBy: req.user.id, priority, dueDate });
        return res.status(201).json({ success: true, message: "Task created successfully", data: task });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (invalidId(projectId)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.member) return res.status(403).json({ success: false, message: "Access denied" });
        return listTasks(req, res, { project: projectId });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getFilteredTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (invalidId(projectId) || (req.query.assignedTo && invalidId(req.query.assignedTo))) return res.status(400).json({ success: false, message: "Invalid ID" });
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.member) return res.status(403).json({ success: false, message: "Access denied" });
        const query = { project: projectId };
        if (req.query.status) { if (!STATUS.includes(req.query.status)) return res.status(400).json({ success: false, message: "Invalid status" }); query.status = req.query.status; }
        if (req.query.priority) { if (!PRIORITY.includes(req.query.priority)) return res.status(400).json({ success: false, message: "Invalid priority" }); query.priority = req.query.priority; }
        if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
        if (req.query.search) { const value = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); query.$or = [{ title: { $regex: value, $options: "i" } }, { description: { $regex: value, $options: "i" } }]; }
        return listTasks(req, res, query);
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getTaskById = async (req, res) => {
    try {
        if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const { task, project } = await loadTask(req.params.id);
        if (!task || !project) return res.status(404).json({ success: false, message: "Task or project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.member) return res.status(403).json({ success: false, message: "Access denied" });
        return res.status(200).json({ success: true, data: await populate(Task.findById(task._id)) });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const updateTask = async (req, res) => {
    try {
        if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const { task, project } = await loadTask(req.params.id);
        if (!task || !project) return res.status(404).json({ success: false, message: "Task or project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.manager) return res.status(403).json({ success: false, message: "Only the project owner or manager can update tasks" });
        ["title", "description", "priority", "dueDate"].forEach((field) => { if (req.body[field] !== undefined) task[field] = req.body[field]; });
        if (req.body.priority && !PRIORITY.includes(req.body.priority)) return res.status(400).json({ success: false, message: "Invalid priority" });
        if (req.body.assignedTo !== undefined) {
            if (invalidId(req.body.assignedTo)) return res.status(400).json({ success: false, message: "Invalid ID" });
            const user = await User.findById(req.body.assignedTo).select("_id");
            if (!user) return res.status(404).json({ success: false, message: "Assigned user not found" });
            const allowed = project.owner.toString() === req.body.assignedTo || project.members.some((member) => member.user.toString() === req.body.assignedTo);
            if (!allowed) return res.status(400).json({ success: false, message: "Assigned user is not a project member" });
            task.assignedTo = req.body.assignedTo;
        }
        await task.save();
        return res.status(200).json({ success: true, message: "Task updated successfully", data: task });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const deleteTask = async (req, res) => {
    try {
        if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const { task, project } = await loadTask(req.params.id);
        if (!task || !project) return res.status(404).json({ success: false, message: "Task or project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.manager) return res.status(403).json({ success: false, message: "Only the project owner or manager can delete tasks" });
        await Task.findByIdAndDelete(task._id);
        return res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const updateTaskStatus = async (req, res) => {
    try {
        if (!STATUS.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid task status" });
        if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const { task, project } = await loadTask(req.params.id);
        if (!task || !project) return res.status(404).json({ success: false, message: "Task or project not found" });
        const access = getAccess(project, req.user.id);
        if (!access.owner && !access.manager && task.assignedTo.toString() !== req.user.id) return res.status(403).json({ success: false, message: "You cannot change this task status" });
        task.status = req.body.status;
        await task.save();
        return res.status(200).json({ success: true, message: "Task status updated successfully", data: task });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getMyProjectTasks = async (req, res) => {
    try {
        const ownedProjects = await Project.find({ owner: req.user.id }).select("_id");
        const projectIds = ownedProjects.map((project) => project._id);
        return listTasks(req, res, { $or: [{ assignedTo: req.user.id }, { project: { $in: projectIds } }] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getMyTasks = async (req, res) => {
    try {
        const query = { assignedTo: req.user.id };
        if (req.query.status) query.status = req.query.status;
        if (req.query.priority) query.priority = req.query.priority;
        return listTasks(req, res, query);
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { createTask, getTasksByProject, getFilteredTasksByProject, getTaskById, updateTask, deleteTask, updateTaskStatus, getMyTasks, getMyProjectTasks };
