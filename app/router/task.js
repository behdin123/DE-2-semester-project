/**
 * This file defines the routes for handling task-related operations.
 * Each route uses the TaskController to handle the operation.
 *
 * Middleware:
 * - verifyToken: Ensures the user is logged in before accessing protected routes
 * - mongoIDValidator: Validates MongoDB ObjectIds in the route parameters
 * - expressValidatorMapper: Handles validation errors
 */

const { TaskController } = require("../controllers/task.controller");

const { verifyToken } = require('../modules/functions.js');

const { mongoIDValidator } = require("../validations/public");

const { expressValidatorMapper } = require("../middlewares/checkErrors");

const router = require("express").Router();

// Create a new task
router.post("/create", verifyToken, TaskController.createTask);

// Get tasks by column ID
router.get("/column/:columnId/tasks", verifyToken, mongoIDValidator("columnId"), expressValidatorMapper, TaskController.getTasksByColumn);

// Get a task by its ID
router.get("/:taskId", verifyToken, mongoIDValidator("taskId"), expressValidatorMapper, TaskController.getTaskById);

// Update a task
router.put("/:taskId/update", verifyToken, mongoIDValidator("taskId"), expressValidatorMapper, TaskController.updateTask);

// Delete a task
router.delete("/:taskId/delete", verifyToken, mongoIDValidator("taskId"), expressValidatorMapper, TaskController.deleteTask);

// Update the column of a task (used when dragging and dropping a task between columns)
router.put("/:taskId/update-column", verifyToken, mongoIDValidator("taskId"), expressValidatorMapper, TaskController.updateTaskColumn);


module.exports = {
  taskRoutes: router,
};