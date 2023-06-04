/**
 * This file defines the TaskController class, which handles task-related operations.
 * The controller includes methods to create, read, update, delete, and change the column of a task.
 */

const autoBind = require("auto-bind");
const { TaskModel } = require("../models/task");
const { ColumnModel } = require("../models/column");

class TaskController {
  constructor() {
    autoBind(this);
  }

  // Creates a new task in the specified column
  async createTask(req, res, next) {
    try {
      const { title, description, columnId } = req.body;

      const column = await ColumnModel.findById(columnId);
      if (!column) throw { status: 404, message: "Column not found" };

      const task = await TaskModel.create({ title, description, column: columnId });

      if (!task) throw { status: 400, message: "Failed to create task" };

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Task created successfully",
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieves tasks by their column ID
  async getTasksByColumn(req, res, next) {
    try {
      const { columnId } = req.params;

      const tasks = await TaskModel.find({ column: columnId });

      if (!tasks) throw { status: 404, message: "Tasks not found" };

      return res.status(200).json({
        status: 200,
        success: true,
        tasks,
      });

    } catch (error) {
      next(error);
    }
  }

  // Retrieves a task by its ID
  async getTaskById(req, res, next) {
    try {
      const { taskId } = req.params;

      const task = await TaskModel.findById(taskId);
      if (!task) throw { status: 404, message: "Task not found" };

      return res.status(200).json({
        status: 200,
        success: true,
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  // Updates a task's title and description
  async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { title, description } = req.body;

      const task = await TaskModel.findByIdAndUpdate(taskId, { title, description }, { new: true });
      if (!task) throw { status: 404, message: "Task not found" };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  // Deletes a task by its ID
  async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;

      const task = await TaskModel.findByIdAndDelete(taskId);
      if (!task) throw { status: 404, message: "Task not found" };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Updates a task's column when it is dragged and dropped to another column
  async updateTaskColumn(req, res, next) {
    try {
      const { taskId } = req.params;
      const { columnId } = req.body;

      const task = await TaskModel.findByIdAndUpdate(taskId, { column: columnId }, { new: true });
      if (!task) throw { status: 404, message: "Task not found" };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Task column updated successfully",
        task,
      });
    } catch (error) {
      console.error('Error in updateTaskColumn:', error);
      next(error);
    }
  }

}




module.exports = {
  TaskController: new TaskController(),
};