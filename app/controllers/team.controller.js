const autoBind = require("auto-bind");
const res = require("express/lib/response");
const mongoose = require('mongoose');
const { UserModel } = require("../models/user");
const { TeamModel } = require("../models/team");


/**
 *  This is the controller for handling team related operations
 */
class TeamController {
  constructor() {
    autoBind(this);
  }

  /** 
   * Creates a new team
  */
  async createTeam(req, res, next) {
    try {
      // Log the req.user object
      console.log("req.user:", req.user);
  
      // Destructure relevant data from request body
      let { name, users, description } = req.body;
  
      // Get ID of the user who is creating the team
      const owner = req.user._id;
  
      // Find user IDs for given usernames
      const userDocuments = await UserModel.find({ username: { $in: users } }).select('_id');
  
      // Check if all usernames were found
      if (userDocuments.length !== users.length) {
        throw { status: 400, message: "One or more usernames do not exist" };
      }
  
      // If all usernames were found, convert them to user IDs
      users = userDocuments.map(user => user._id);
      
      console.log({ name, description, users, owner });
      // Create a new team in the database using the data provided
      const team = await TeamModel.create({
        name,
        description,
        users,
        owner,
      });
  
      // If team creation was unsuccessful, throw an error
      if (!team) throw { status: 500, message: "Creating the team encountered a problem" };
  
      // Return a success response if team creation was successful
      return res.status(201).json({
        status: 201,
        success: true,
        message: "The team was successfully created",
      });
  
    } catch (error) {
      next(error);
    }
  }

  /** 
   * Gets a list of all the teams
  */
  async getListOfTeam(req, res, next) {
    try {
      // Get all teams from the database
      const teams = await TeamModel.find({});

      // Return the teams in response
      return res.status(200).json({
        status: 200,
        success: true,
        teams,
      });
    } catch (error) {
      next(error);
    }
  }


  /** 
   * Gets a team by its id
  */
  async getTeamById(req, res, next) {
    try {
      // Get the ID of the team from the request parameters
      const teamID = req.params.id;

      // Find the team in the database using its ID
      const team = await TeamModel.findById(teamID);

      // If no team was found, throw an error
      if (!team) throw { status: 404, message: "No team was found" };

      return res.status(200).json({
        status: 200,
        success: true,
        team,
      });

    } catch (error) {
      next(error);
    }
  }


  /** 
   * Retrieves all teams owned by or containing one user
  */
  async getMyTeams(req, res, next) {
    try {
      // get user id from authenticated user
      const userID = req.user._id;

      // find all teams where user is owner or a member 
      const teams = await TeamModel.aggregate([
        
        {
          $match : {
            $or: [{ owner: mongoose.Types.ObjectId(userID) }, { users: mongoose.Types.ObjectId(userID) }]
          },
        },
        {
          // join with users collection to get owner details
          $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "owner"
          }
        },
        {
          // join with users collection to get user details
          $lookup : {
            from : "users",
            localField : "users",
            foreignField : "_id",
            as : "users"
          }
        },
        {
          $addFields: {
            users: {
              $map: {
                input: "$users",
                as: "user",
                in: {
                  _id: "$$user._id",
                  first_name: "$$user.first_name",
                  last_name: "$$user.last_name",
                  username: "$$user.username",
                  profile_image: "$$user.profile_image",
                  // add any other fields you want to include
                }
              }
            }
          }
        },
        {
          // exclude sensitive owner information from response
          $project : {
            "owner.roles" : 0,
            "owner.password" : 0,
            "owner.token" : 0,
            "owner.teams" : 0,
            "owner.skills" : 0,
            "owner.inviteRequests" : 0,
          }
        },
        {
          // destructure owner object from array returned by lookup
          $unwind : "$owner"
        }
      ]);

      // return teams in response
      return res.status(200).json({
        status: 200,
        success: true,
        teams,
      });
    } catch (error) {
      console.error('Error:', error); // Log errors
    }
  }


  /** 
   * Deletes a single team with the given ID
  */
  async removeTeamById(req, res, next) {
    try {
      // Get the team ID from the request parameters
      const teamID = req.params.id;

      // Find the team with the given ID
      const team = await TeamModel.findById(teamID);

      // Throw an error if no team is found with the given ID
      if (!team) throw { status: 404, message: "No team was found" };
      const result = await TeamModel.deleteOne({ _id: teamID });

      // Throw an error if the team was not deleted
      if (result.deletedCount == 0)
        throw { status: 500, message: "The team was not deleted. Please try again" };

      // Return a success message
      return res.status(200).json({
        status: 200,
        success: true,
        message: "The team was successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  }



  /** 
   * Checks whether a given user is a member of a given team
  */
  async findUserInTeam(teamID, userID) {

    // Find a team that either the owner or a user is a member of, and has the specified teamID
    const result = await TeamModel.findOne({
      $or: [{ owner: userID }, { users: userID }],
      _id: teamID,
    });

    // If a result is found, return true, else return false
    return !!result;
  }



  /** 
   * Sends an invitation to a specified user to join a specified team
  */
  async inviteUserToTeam(req, res, next) {
    try {

      // Get the ID of the user making the request
      const userID = req.user._id;

      // Get the username and team ID from the request parameters
      const { username, teamID } = req.params;

      // Check if the user making the request is part of the team they are trying to invite to
      const team = await this.findUserInTeam(teamID, userID);
      if (!team)
        throw { status: 400, message: "No team was found to invite people to" };

      // Find the user being invited to the team
      const user = await UserModel.findOne({ username });

      if (!user)
        throw {
          status: 400,
          message: "The user you are trying to invite to the team was not found",
        };

      // Check if the user has already been invited to the team
      const userInvited = await this.findUserInTeam(teamID, user._id);
      if (userInvited)
        throw {
          status: 400,
          message: "The user has already been invited to the team",
        };

      // Create an invitation request object
      const request = {
        caller: req.user.username,
        requestDate: new Date(),
        teamID,
        status: "pending",
      };

      // Add the invitation request to the invited user's profile
      const updateUserResult = await UserModel.updateOne(
        { username },
        {
          $push: { inviteRequests: request },
        }
      );

      if (updateUserResult.modifiedCount == 0)
        throw { status: 500, message: "The invitation request was not registered" };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "The request was successfully registered",
      });

    } catch (error) {
      next(error);
    }
  }


  /** 
   * Updates a specified team's information with the data provided in the request body
  */
  async updateTeam(req, res, next) {
    try {

      // Extract the data from the request body
      console.log(req.body);
      const data = { ...req.body };

      const userDocuments = await UserModel.find({ username: { $in: data.users } }).select('_id');
      if (userDocuments.length !== data.users.length) {
        throw { status: 400, message: "One or more usernames do not exist" };
      }
      data.users = userDocuments.map((user) => user._id);

      // Extract the user ID and team ID from the request
      const userID = req.user._id;
      const { teamID } = req.params;

      // Find the team that the user owns with the specified team ID
      const team = await TeamModel.findOne({ owner: userID, _id: teamID });

      // Throw an error if no such team is found
      if (!team) throw { status: 404, message: "No team was found with these specifications" };

      // Update the team information with the new data
      const teamEditResult = await TeamModel.updateOne(
        { _id: teamID },
        { $set: data }
      );
      
      // Throw an error if the update is unsuccessful
      if (teamEditResult.modifiedCount == 0)
        throw { status: 500, message: "The update of team information was not successful" };
      

      // Return a success response
      return res.status(200).json({
        status: 200,
        success: true,
        message: "The update was successful",
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  removeUserFromTeam() {}
}

module.exports = {
  TeamController: new TeamController(),
};
