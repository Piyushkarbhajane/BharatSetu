const mongoose=require("mongoose");


const projectSchema=new mongoose.Schema({

name:{

    type:String,
    required:true,
    trim:true

},

description:{
    type:String,
    default:""
}
,
owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    
},
members: [
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        role: {
            type: String,
            enum: ["manager", "member"],
            default: "member"
        }
    }
],
joinRequests: [
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        },
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }
],
status: {
    type: String,
    enum: [ "active","completed","archived" ],
    default: "active"
}
,

startDate:{
    type:Date,
    default:Date.now
},

dueDate:{

    type:Date


}

},
{
    timestamps:true
});


const Project = mongoose.model(
    "Project",
    projectSchema
);

module.exports = Project;