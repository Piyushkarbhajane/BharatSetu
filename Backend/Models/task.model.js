const mongoose=require("mongoose");

const taskSchema= new mongoose.Schema({

    title:{
        type:String,
        required:true,
        
    },
    description:{
        type:String,
        default:""
    },
    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:true

    },
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
        
    },
    createdBy:{
        type : mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    priority:{
        type:String,
        enum:["low","medium","high"],
        default:"medium",

        required:true
    },
    status:{
        type:String,
        enum:["todo","in-progress","completed"],
        default:"todo"
    },
    dueDate:{
        type:Date,
        required:true

    }



},{
    timestamps:true
});

const Task = mongoose.model(
    "Task",
    taskSchema
);

module.exports = Task;

