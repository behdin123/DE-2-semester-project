/**
 * This file defines the routes for project-related requests.
 * It imports the ProjectController for handling project-related logic,
 * and various middlewares and functions for handling user input validation, file uploads, authentication, and request mapping.
 * It maps the routes to specific controller functions that handle the logic of the routes.
*/ 

// For handling project-related requests
const { ProjectController } = require("../controllers/project.controller");

const { verifyToken } = require('../modules/functions.js');

// For handling validation errors
const { expressValidatorMapper } = require("../middlewares/checkErrors");

// For validating user input when creating a new project
const { createProjectValidator } = require("../validations/project");

// For handling file uploads using the express-fileupload module
const { uploadFile } = require("../modules/express-fileupload");

// express-fileupload module for handling file uploads
const fileupload = require("express-fileupload");

// mongoIDValidator function for validating MongoDB ObjectIds
const { mongoIDValidator } = require("../validations/public");

// addStrToArr middleware for converting comma-separated strings to arrays
const { addStrToArr } = require("../middlewares/convertStringToArray");


const router = require("express").Router();


// Create a new project
router.post("/create", fileupload(), verifyToken, addStrToArr("tags"), uploadFile, createProjectValidator(),expressValidatorMapper, ProjectController.createProject)

// Get a list of all projects
router.get("/list", verifyToken, ProjectController.getAllProject)

// Get a specific project by ID
router.get("/:id", verifyToken, mongoIDValidator("id"), expressValidatorMapper, ProjectController.getProjectById)

// Remove a project by ID
router.delete("/remove/:id", verifyToken, mongoIDValidator("id"), expressValidatorMapper, ProjectController.removeProject)

// Update a project by ID
router.put("/edit/:id", verifyToken, mongoIDValidator("id"), expressValidatorMapper,ProjectController.updateProject)

// Update a project's image by ID
router.patch("/edit-projectImage/:id", fileupload(), verifyToken, uploadFile, mongoIDValidator("id"), expressValidatorMapper,ProjectController.updateProjectImage)

// Export the router as a module
module.exports = {
    projectRoutes : router
}