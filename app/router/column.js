const { ProjectController } = require("../controllers/project.controller");

const { verifyToken } = require('../modules/functions.js');

const { mongoIDValidator } = require("../validations/public");

const { expressValidatorMapper } = require("../middlewares/checkErrors");

const router = require("express").Router();

// Get a column by the project ID
router.get("/:projectId/columns", verifyToken, mongoIDValidator("projectId"), expressValidatorMapper, ProjectController.getColumnsByProjectId);


module.exports = {
    columnRoutes : router
}