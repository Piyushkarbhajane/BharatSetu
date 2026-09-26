const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const adminMiddleware =
    require("../middleware/admin.middleware");

const {
    getAllUsers,
    deleteUser,
    blockUser,unblockUser,changeUserRole,
    getDashboardStats,
} = require("../controllers/admin.controller");


router.get(
    "/users",
    authMiddleware,
    adminMiddleware,
    getAllUsers
);

router.delete(
    "/users/:id",
    authMiddleware,
    adminMiddleware,
    deleteUser
);

router.put(
    "/users/:id/block",
    authMiddleware,
    adminMiddleware,
    blockUser
);

router.put(
    "/users/:id/unblock",
    authMiddleware,
    adminMiddleware,
    unblockUser
);

router.put(
    "/users/:id/role",
    authMiddleware,
    adminMiddleware,
    changeUserRole
);

router.get(
    "/dashboard/stats",
    authMiddleware,
    adminMiddleware,
    getDashboardStats
);

module.exports = router;