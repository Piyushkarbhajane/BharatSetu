const User = require("../Models/user.model");


// =====================================
// GET ALL USERS
// =====================================

const getAllUsers = async (req, res) => {

    try {

        const users = await User
            .find({})
            .select(
                "-password -otp -otpExpires -__v"
            );

        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            users
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================
// DELETE USER
// =====================================

const deleteUser = async (req, res) => {

    try {

        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.deleteOne();

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const blockUser=async (req,res)=>{
    try{

        const {id}=req.params;
        const user =await User.findById(id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        if (req.user.id.toString() === id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot block your own account"
            });
        }

        user.isBlocked=true;
        await user.save();
        return res.status(200).json({
            success:true,
            message:"User blocked successfully"
        });

    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const unblockUser=async (req,res)=>{
    try{
        const {id}=req.params;
        const user =await User.findById(id);
        if(!user){
            return res.status(404).json({   
                success:false,
                message:"User not found"
            });
        }
        if (!user.isBlocked) {
            return res.status(400).json({
                success: false,
                message: "User is not blocked"
            });
        }

        user.isBlocked = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const changeUserRole=async(req,res)=>{


    try{
           const {id}=req.params;
           const {role}=req.body;

           const user =await User.findById(id);
           if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
           }
           if(!role){
            return res.status(400).json({
                success:false,
                message:"Role is required"
            });
           }

        if(role!=="user" && role!=="admin"){
            return res.status(400).json({
                success:false,
                message:"Invalid role"
            });
        
        }

        user.role=role;

            await user.save();

           return res.status(200).json({
            success:true,
            message:"User role updated successfully"
           });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getDashboardStats = async (req, res,next) => {
    try {
        const totalUsers = await User.countDocuments();
        const blockedUsers = await User.countDocuments({ isBlocked: true });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const regularUsers = await User.countDocuments({ role: 'user' });
        const verifiedUsers = await User.countDocuments({ isVerified: true });

        return res.status(200).json({
            success: true,
            message: "Dashboard stats retrieved successfully",
            stats: {
                totalUsers,
                blockedUsers,
                adminUsers,
                regularUsers,
                verifiedUsers
            }
        });
    } catch (error) {
        next(error); // Pass the error to the next middleware (error handler)
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    blockUser,
    unblockUser,
    changeUserRole,
    getDashboardStats
};