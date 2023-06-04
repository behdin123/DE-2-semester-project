/**
 * This file exports a Mongoose model for team documents.
 * The model defines the schema of teams, including the team name, description, username, users, and owner.
 * The schema also includes timestamps for when the document was created and updated.
 */

const { string } = require("joi");

const mongoose = require("mongoose");


// Define the schema for a team document
const TeamSchema = new mongoose.Schema({
    name : {type : String, required : true},
    description : {type : String},
    users : {type : [mongoose.Types.ObjectId]},
    owner : {type : mongoose.Types.ObjectId, required : true},
}, {
    timestamps : true
});

// Create a Mongoose model for team documents
const TeamModel = mongoose.model("team", TeamSchema);

module.exports = {
    TeamModel
}