const { UserModel } = require("../models/user");
const { createLinkForFiles } = require("../modules/functions");

/**
 * This class represents the UserController, which is responsible for handling requests related to users
 */
class UserController {

   /**
   * Returns the profile information of the authenticated user
   */
  getProfile(req, res, next) {
    try {
      const user = req.user;

      // Call the createLinkForFiles function to create a link to the user's profile image
      user.profile_image = createLinkForFiles(user.profile_image, req);

      // Send a JSON response with the user profile
      return res.status(200).json({
        status: 200,
        success: true,
        user,
      });

    } catch (error) {
      next(error);
    }
  }


  /**
   * Edits the profile information of the authenticated user
   */
  async editProfile(req, res, next) {
    try {
      // Clone the incoming data object to prevent accidental mutation of the original
      let data = { ...req.body };
      const userID = req.user._id;

      // Define the valid fields to be updated and invalid data values to be removed
      let fields = ["first_name", "last_name", "skills"];
      let badValues = ["", " ", null, undefined, 0, -1, NaN, [], {}];

      // Iterate through the incoming data and remove invalid fields and values
      Object.entries(data).forEach(([key, value]) => {
        console.log(key, value);
        if (!fields.includes(key)) delete data[key];
        if (badValues.includes(value)) delete data[key];
      });
      console.log(data);

      // Update the user's profile data in the database
      const result = await UserModel.updateOne({ _id: userID }, { $set: data });

      // If the update was successful, return a success message
      if (result.modifiedCount > 0) {
        return res.status(200).json({
          status: 200,
          succerss: true,
          message: "The profile was updated successfully.",
        });
      }

      // If the update failed, throw an error
      throw { status: 400, message: "The update was not successful" };
    } catch (error) {
      next(error);
    }
  }

  


  /**
   * Uploads a profile image for the authenticated user
  */
  async uploadProfileImage(req, res, next) {
    try {
      const userID = req.user._id;

      // extract the file path from the request object
      const filePath = req.file?.path?.substring(7);
      const result = await UserModel.updateOne(
        { _id: userID },

        // update the user's profile image path in the database
        { $set: { profile_image: filePath } }
      );

      // check if the update was not successful and throw error
      if (result.modifiedCount == 0)
        throw { status: 400, message: "The update was not successful" };

      // send a success response
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
   * Returns all invite requests for the authenticated user
  */
  async getAllRequest(req, res, next) {
    try {
      const userID = req.user._id;
      const inviteRequests = await UserModel.aggregate([
        {
          // Match documents where the _id field equals the userID variable
          $match : {
            _id: userID 
          }
        },
        {
          // Perform a left outer join with the 'users' collection on the 'username' field of the 'inviteRequests' array
          $lookup : {
            from : "users",
            localField : "inviteRequests.caller",
            foreignField : "username",
            as : "callerInfo"
          }
        }
      ]);

      // Return response containing the 'inviteRequests' array with additional information from the 'users' collection
      return res.json({
        requests: inviteRequests,
      });
    } catch (error) {
      next(error);
    }
  }


  /*
   * Get invite requests for the authenticated user with a certain status.
  */
  async getRequestsByStatus(req, res, next) {
    try {
      // Extract status and user ID from request parameters
      const { status } = req.params;
      const userID = req.user._id;

      // Find the user by ID and filter their inviteRequests by status
      const requests = await UserModel.aggregate([
        {
          $match: { _id: userID },
        },
        {
          $project: {
            inviteRequests: 1,
            _id: 0,
            inviteRequests : {
                $filter : {
                    input : "$inviteRequests",
                    as : "request",
                    cond : {
                        $eq : ["$$request.status", status]
                    }
                }
            }
          },
        },
      ]);

      // Return the filtered inviteRequests array in the response, or an empty array if it's undefined
      return res.status(200).json({
        status: 200,
        success: true,
        requests : requests?.[0]?.inviteRequests || []
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * changeStatusRequest handles changing the status of a request in the user's invite requests array.
  */
  async changeStatusRequest(req, res, next) {
      try {
          // Retrieve the request ID and new status from the request parameters
          const {id, status} = req.params;

          // Find the user's request by its ID
          const request = await UserModel.findOne({"inviteRequests._id" : id})

          // If the request doesn't exist, throw a 404 error
          if(!request) throw {status : 404, message : "No request was found with these specifications"}

          // Find the request with the matching ID and check if it is still pending
          const findRequest = request.inviteRequests.find(item => item.id == id);
          if(findRequest.status !== "pending") throw {status : 400, message : "This request has already been accepted or rejected before"}

          // Check if the submitted status is valid
          if(!["accepted", "rejected"].includes(status)) throw {status : 400, message : "The submitted information is not valid"}

          // Update the request status in the database
          const updateResult = await UserModel.updateOne({"inviteRequests._id" : id}, {
              $set : {"inviteRequests.$.status" : status}
          })

          // If the update was unsuccessful, throw a 500 error
          if(updateResult.modifiedCount == 0) throw {status : 500, message : "The status of the request was not changed"}

          // Return a success message if the update was successful
          return res.status(200).json({
              status : 200,
              success : true,
              message : "The status of the request was changed successfully."
          })

        } catch (error) {
        next(error)
      }
  }
}

module.exports = {
  UserController: new UserController(),
};
