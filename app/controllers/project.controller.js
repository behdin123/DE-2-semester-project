const autoBind = require("auto-bind");
const { ProjectModel } = require("../models/project");
const { createLinkForFiles } = require("../modules/functions");
const { ColumnModel } = require("../models/column");


/**
 * This is the controller for handling project related operations
 * class ProjectController
 */
class ProjectController {
  constructor() {
    autoBind(this);
  }

  /**
   * Creates default columns for a newly created project
   * method - createDefaultColumns
   * @param {string} projectId - The ID of the project to create columns for
  */

  async createDefaultColumns(projectId) {

    // Define default columns as an array of strings
    const defaultColumns = ["To Do", "In Progress", "Done"];

    // Loop through default columns using Array.entries() method to get the index and value
    for (const [index, title] of defaultColumns.entries()) {
      const newColumn = new ColumnModel({
        title: title,
        project: projectId,
        order: index,
      });

    // Save the new column to the database and get its ID
    await newColumn.save();

    }
  }

  /**
   * Creates a new project
   * method - createProject
   * @param {Object} req - The request object
   * @param {Object} res - The response object
   * @param {Function} next - The next middleware function
  */

  async createProject(req, res, next) {
    console.log("req.user:", req.user);
    console.log('createProject called'); 
    try {
      console.log(req.body)
      const {title, description, image, tags } = req.body;
      console.log(tags);

      const owner = req.user._id

      console.log('Before creating a new project'); // Add this line
      // create new project
      const result = await ProjectModel.create({title, description, owner, image, tags,});

      console.log('After creating a new project, result:', result); // Add this line

      // check if the project was created successfully
      if (!result)throw {
        status: 400, 
        message: "Adding the project encountered a problem",
      };

      console.log('Before creating default columns'); // Add this line
      // Create default columns for the project
      await this.createDefaultColumns(result._id);
      console.log('After creating default columns'); // Add this line

      // return success message
      return res.status(201).json({
        status : 201, 
        success: true, 
        message : 'The project was successfully created',
        project: result, // Add this line to include the project object in the response
      })
    } 
    catch (error) {
      // if there is any error, it goes to the error handling middleware
      next(error);
    }
  }


  /**
   * Gets all projects for the current user
   * method - getAllProject
   * @param {Object} req - The request object
   * @param {Object} res - The response object
  */

  async getAllProject(req, res, next) {
    try {
      const owner = req.user._id;
      const projects = await ProjectModel.find({ owner });

      // Update image link for each project
      for (const project of projects) {
        project.image = createLinkForFiles(project.image, req);
      }

      // Send response with projects
      return res.status(200).json({
        status: 200,
        success: true,
        projects,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Finds a project by ID for the current user
   * method - findProject
   * @param {string} projectID - The ID of the project to find
   * @param {string} owner - The ID of the user who owns the project
   * returns Object - The project found
   * throws Object - An error if the project is not found
  */

  async findProject(projectID, owner) {

    // Search for the project with given projectID and owner
    const project = await ProjectModel.findOne({ owner, _id: projectID });

    // If project not found, throw an error
    if (!project) throw { status: 404, message: "No project was found" };

    // Return the found project
    return project;

  }


  /**
   * Gets a project by ID for the current user
   * method - getProjectById
   * @param {Object} req - The request object
   * @param {Object} res - The response object
  */

  async getProjectById(req, res, next) {
    try {

      const owner = req.user._id; // Get the owner of the project from the request object
      const projectID = req.params.id; // Get the ID of the project from the request parameters
      const project = await this.findProject(projectID, owner); // Find the project with the specified ID and owner

      // Generate a link for the project image using the createLinkForFiles() function
      project.image = createLinkForFiles(project.image, req); 

      return res.status(200).json({
        status: 200,
        success: true,
        project, // Return the project object in the response
      });
      
    } catch (error) {
      console.log(error);
      next(error);
    }
  }


  /**
   * Remove a project by ID for a user
   * method - removeProject
   * @param {Object} req - The request object
   * @param {Object} res - The response object
  */

  async removeProject(req, res, next) {
    try {

      const owner = req.user._id;
      const projectID = req.params.id;

      // Check if the project belongs to the user
      await this.findProject(projectID, owner);

      // Delete the columns associated with the project
      const deleteColumnsResult = await ColumnModel.deleteMany({
        project: projectID,
      });

      // Delete the project from the database
      const deleteProjectResult = await ProjectModel.deleteOne({
        _id: projectID,
      });

      // Check if the project was successfully deleted
      if (deleteProjectResult.deletedCount == 0)
        throw { status: 400, message: "The project was not deleted" };

      // Return success message
      return res.status(200).json({
        status: 200,
        success: true,
        message: "The project and associated columns were successfully deleted",
      });

    } catch (error) {
      next(error);
    }
  }


  /**
   * Update a project by ID for a user
   * method - updateProject
   * @param {Object} req - The request object
   * @param {Object} res - The response object
  */

  async updateProject(req, res, next) {
    try {
      const owner = req.user._id;
      const projectID = req.params.id;

      // Check if the project belongs to the user
      const project = await this.findProject(projectID, owner);

      // Extract data from request body
      const data = { ...req.body };

      // Remove unwanted fields from data
      Object.entries(data).forEach(([key, value]) => {
        if (!["title", "description", "tags"].includes(key)) delete data[key];
        if (["", " ", 0, null, undefined, NaN].includes(value))
          delete data[key];
        if (key == "tags" && data["tags"].constructor === Array) {
          data["tags"] = data["tags"].filter((val) => {
            if (!["", " ", 0, null, undefined, NaN].includes(val)) return val;
          });
          if (data["tags"].length == 0) delete data["tags"];
        }
      });

      // Update the project in the database
      const updateResult = await ProjectModel.updateOne(
        { _id: projectID },
        { $set: data }
      );

      // Check if the project was successfully updated
      if (updateResult.modifiedCount == 0)
        throw { status: 400, message: "The update was not successful" };

      // Return success message
      return res.status(200).json({
        status: 200,
        success: true,
        message: "The update was successful",
      });

    } catch (error) {
      next(error);
    }
  }


  /**
   * Update a projectImage by ID for a user
   * method - updateProjectImage
   * @param {Object} req - The request object
   * @param {Object} res - The response object
  */

  async updateProjectImage(req, res, next) {
    try {
      const { image } = req.body;
      const owner = req.user._id;
      const projectID = req.params.id;

      // Check if the project belongs to the user
      await this.findProject(projectID, owner);

      // Update the project image in the database
      const updateResult = await ProjectModel.updateOne(
        { _id: projectID },
        { $set: { image } }
      );

      // Check if the project image was successfully updated
      if (updateResult.modifiedCount == 0)
        throw { status: 400, message: "The update was not successful" };

      // Return success message
      return res.status(200).json({
        status: 200,
        success: true,
        message: "The update was successful",
      });

    } catch (error) {
      next(error);
    }
  }

  getAllProjectOfTeam() {}
  getProjectOfUser() {}
}

module.exports = {
  ProjectController: new ProjectController(),
};
