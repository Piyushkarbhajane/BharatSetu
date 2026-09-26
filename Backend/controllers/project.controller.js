const Project=require("../Models/project.model");
const User=require("../Models/user.model");
const mongoose = require("mongoose");

const createProject=async(req,res)=>{


  try{
      const {name,description,status,dueDate} =req.body;


    const userId=req.user.id;

     if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

    const project = new Project({
    name,
    description,
    owner: userId,
    status,
    dueDate
});


await project.save();

return res.status(201).json({
    success: true,
    message: "Project created successfully",
    project
}); }
  catch(error){
    return res.status(500).json({

        message:error.message,
        success:false
    })
  }


}




const getMyProject=async(req,res)=>{

    try{


        const userId=req.user.id;

                const projects = await Project.find({
    owner: userId
}).populate("owner", "name email").populate("members.user", "name email");
                
        projects.forEach((project) => {
            const members = project.members
                .map((member) => member.user?.name || member.user?.email)
                .filter(Boolean);
            project.description = `${project.description || ""}${members.length ? ` Members: ${members.join(", ")}` : " Members: none yet"}`;
        });

         return res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });


    }
    catch(error)
    {
        return res.status(500).json({

            message:error.message,
            success:false
        })
    }

}

const discoverProjects = async (req, res) => {
    try {
        const projects = await Project.find({ owner: { $ne: req.user.id } })
            .select("name description status owner members")
            .populate("owner", "name email");
        return res.status(200).json({ success: true, count: projects.length, projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getProjectById = async (req, res) => {

    try {

        const { id } = req.params;

        const project = await Project.findById(id)
            .populate("owner", "name email")
            .populate("members.user", "name email");
        if(!project){
            return res.status(404).json({

                message:"there are  no projects please create new projects",
                success:false
            })
        }

        const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
        const isMember = project.members.some((member) => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === req.user.id;
        });
        if (ownerId !== req.user.id && !isMember) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to access this project"
    });
        }

    

        return res.status(200).json({

            message:"Project fetched successfully",
            success:true,
            data: project
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateProject = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            description,
            status,
            dueDate
        } = req.body;
        const project = await Project.findById(id);

        if(!project){
            return res.status(404).json({

                message:"unable to find the projects",
                success:false
            })        }

            if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to update this project"
    });
}


   project.name=name||project.name;
   project.description=description||project.description;
   project.status=status||project.status;
   project.dueDate=dueDate||project.dueDate;
   await project.save();
   return res.status(200).json({

    message:"Project updated successfully",
    success:true,
    project
   })

    


    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteProject=async(req,res)=>{
  

try{
      const {id}=req.params;

    const project = await Project.findById(id);
    if(!project){
        return res.status(404).json({


            message:"project does not exist",
            success:false,

        })
    }
    if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to update this project"
    });}
    await Project.findByIdAndDelete(id);



    return res.status(200).json({

        message:"project deleted successfully",
        success:true
    })





}
catch(error)
{
   return res.status(502).json({

    message:"unable to delete project",
    success : false
   })
}}
const addProjectMember = async (req, res) => {

    try {

        const { id } = req.params;
        const { email, role } = req.body;

        // Step 1
        const project =await Project.findById(id);

        // Step 2
        if(!project)
        {
            return res.status(404).json({

                success:false,
                message:"this project is not available"
            })
        }

        // Step 3
        if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to update this project"
    });}

        // Step 4
        // Find User using email

        const user=await User.findOne({email:email});
        if(!user){
            return res.status(404).json({

                success:false,message:"user is not there in database"
            })
        }
         const alreadyMember = project.members.some(
    (member) => member.user.toString() === user._id.toString()
);
if (alreadyMember) {
    return res.status(400).json({
        success: false,
        message: "User is already a project member"
    });
}
if (project.owner.toString() === user._id.toString()) {
    return res.status(400).json({
        success: false,
        message: "Project owner cannot be added as a member"
    });
}
if (role && !["manager", "member"].includes(role)) {
    return res.status(400).json({
        success: false,
        message: "Role must be manager or member"
    });
}
project.members.push({
    user: user._id,
    role: role || "member"
});

await project.save();
return res.status(200).json({
    success: true,
    message: "Member added successfully",
    project
});

        

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const requestProjectAccess = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        if (project.owner.toString() === req.user.id || project.members.some((member) => member.user.toString() === req.user.id)) return res.status(400).json({ success: false, message: "You already have access to this project" });
        const existing = project.joinRequests.find((request) => request.user.toString() === req.user.id && request.status === "pending");
        if (existing) return res.status(400).json({ success: false, message: "Join request is already pending" });
        project.joinRequests = project.joinRequests.filter((request) => request.user.toString() !== req.user.id || request.status !== "rejected");
        project.joinRequests.push({ user: req.user.id });
        await project.save();
        return res.status(201).json({ success: true, message: "Join request sent successfully" });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getJoinRequests = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate("joinRequests.user", "name email");
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        if (project.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Only the project owner can view join requests" });
        const requests = project.joinRequests.filter((request) => request.status === "pending");
        return res.status(200).json({ success: true, count: requests.length, requests });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const decideJoinRequest = async (req, res) => {
    try {
        const { id, requestId } = req.params;
        const { decision, role } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ success: false, message: "Invalid ID" });
        if (!["accepted", "rejected"].includes(decision)) return res.status(400).json({ success: false, message: "Decision must be accepted or rejected" });
        if (role && !["manager", "member"].includes(role)) return res.status(400).json({ success: false, message: "Role must be manager or member" });
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        if (project.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Only the project owner can decide join requests" });
        const request = project.joinRequests.id(requestId);
        if (!request || request.status !== "pending") return res.status(404).json({ success: false, message: "Pending join request not found" });
        request.status = decision;
        if (decision === "accepted") project.members.push({ user: request.user, role: role || "member" });
        await project.save();
        return res.status(200).json({ success: true, message: `Join request ${decision}`, project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getProjectMembers = async (req, res) => {

    try {

        const { id } = req.params;

        
        const project = await Project.findById(id)
            .populate("members.user", "name email");

        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        
        const isOwner = project.owner.toString() === req.user.id;

        
        const isMember = project.members.some(
            (member) => member.user._id.toString() === req.user.id
        );

        
        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        
        return res.status(200).json({
            success: true,
            count: project.members.length,
            members: project.members
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const removeProjectMember = async (req, res) => {

    try {

        const { id, memberId } = req.params;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Only owner can remove members
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only project owner can remove members"
            });
        }

        // Prevent removing owner
        if (project.owner.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: "Project owner cannot be removed"
            });
        }

        
        const memberExists = project.members.some(
            (member) => member.user.toString() === memberId
        );

        if (!memberExists) {
            return res.status(404).json({
                success: false,
                message: "Member not found in project"
            });
        }

        
        project.members = project.members.filter(
            (member) => member.user.toString() !== memberId
        );

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
            project
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const changeMemberRole = async (req, res) => {

    try {

        const { id, memberId } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only project owner can change member roles"
            });
        }

        if (!["manager", "member"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const member = project.members.find(
            (member) => member.user.toString() === memberId
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        member.role = role;

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Member role updated successfully",
            project
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
module.exports={
    createProject,
    getMyProject,
    discoverProjects,
    getProjectById,
    updateProject,deleteProject,addProjectMember,
    getProjectMembers,
    removeProjectMember,
    requestProjectAccess,
    getJoinRequests,
    decideJoinRequest,
    changeMemberRole
}