/**
 * This file exports a Mongoose Model for a Project document.
 */

const mongoose = require("mongoose");

// Define a new Mongoose schema for ProjectSchema
const ProjectSchema = new mongoose.Schema({
    title : {type : String, required : true},
    description : {type : String},
    image : {type : String, default : "/defaults/default.png"},
    owner : {type : mongoose.Types.ObjectId},
    team : {type : mongoose.Types.ObjectId},
    private : {type : Boolean},
    tags : {type : [String], default : []}
}, {
    timestamps : true
});

// Create a Mongoose Model for the Project document with the defined schema
const ProjectModel = mongoose.model("project", ProjectSchema);

module.exports = {
    ProjectModel
}

