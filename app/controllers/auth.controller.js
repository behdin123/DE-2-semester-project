const { validationResult } = require("express-validator");
const { UserModel } = require("../models/user");
const { hashString, tokenGenerator } = require("../modules/functions");
const bcrypt = require("bcrypt")

/**
 * AuthController is a class that handles the authentication of users.
 * It has methods for registering a new user, logging in, and resetting passwords.
 */
class AuthController{

    /**
     * Handles the registration of a new user.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {function} next - The next middleware function.
     */
    
    async register(req, res, next){
        try { 
        // Extract the user information from the request body
        const {username, password, confirmPassword, email, mobile} = req.body;

        // Hash the user's password using bcrypt
        const hash_password = hashString(password) 

        // Create a new user object in the database
        const user = await UserModel.create({ username, email, confirmPassword, password: hash_password, mobile })
        
        // If the username is already in use, catch the error and throw a custom error object
        .catch(err => {
           if(err?.code == 11000){
               throw {status : 400, message : "The username is already in use"}
           }
        })

        // Return the created user
        return res.json(user)
        } 

        catch (error) {
        next(error)
        }
    }



    /**
     * Handles the login of an existing user.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {function} next - The next middleware function.
     */

    async login(req, res, next){
        try {
            const {username, password} = req.body;

            // Find the user by their username in the database
            const user = await UserModel.findOne({username}).select('_id username password');

            // If no user is found, throw an error
            if(!user) throw {status : 401, message : "The username or password is incorrect"}

            // Compare the password entered by the user to the hash stored in the database
            const compareResult = bcrypt.compareSync(password, user.password);

            // If the passwords don't match, throw an error
            if(!compareResult) throw {status : 401, message : "The username or password is incorrect"}

            // Generate a token for the user
            const token = tokenGenerator(user); 
            console.log("Generated JWT token:", token);

            // Save the token to the user's record in the database
            user.token = token;
            await user.save()

            // Set the JWT token as a cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });

            // Send a response with the token to the user
            return res.status(200).json({
                status: 200,
                success: true,
                message: "You have successfully logged in to your account.",
                token
            })

        } catch (error) {
            next(error)
        }
    }

    // Method for resetting password
    resetPassword(){

    }
}

module.exports = {
    AuthController : new AuthController()
}