const express=require("express");

const router=express.Router();


const {createProject,getMyProject,discoverProjects,getProjectById,updateProject,deleteProject,addProjectMember,getProjectMembers,
    removeProjectMember,changeMemberRole
    ,requestProjectAccess,getJoinRequests,decideJoinRequest
}=require("../controllers/project.controller");

const authMiddleware=require("../middleware/auth.middleware");
const { getProjectDashboard } = require("../controllers/dashboard.controller");

router.post("/create-project",authMiddleware,createProject);
router.get("/my-projects",authMiddleware,getMyProject);
router.get("/discover",authMiddleware,discoverProjects);
router.get("/:id/dashboard",authMiddleware,getProjectDashboard)
router.post("/:id/join-requests",authMiddleware,requestProjectAccess);
router.get("/:id/join-requests",authMiddleware,getJoinRequests);
router.patch("/:id/join-requests/:requestId",authMiddleware,decideJoinRequest);
router.get("/:id",authMiddleware,getProjectById)
router.put("/:id",authMiddleware,updateProject)
router.delete("/:id",authMiddleware,deleteProject)
router.post("/:id/members",authMiddleware,addProjectMember);
router.get("/:id/members",authMiddleware,getProjectMembers);
router.delete("/:id/members/:memberId",authMiddleware,removeProjectMember);
router.patch("/:id/members/:memberId",authMiddleware,changeMemberRole);


module.exports=router;