/**
 * This file exports two validation functions: registerValidator and loginValidation.
 * The registerValidator function defines validation rules for user registration, including validation for the username, email, mobile phone number, and password.
 * The loginValidation function defines validation rules for user login, including validation for the username and password.
 * These functions use the express-validator middleware to validate inputs.
 */

// Import dependencies
const {body} = require("express-validator")
const { UserModel } = require("../models/user")


// Function for validating user registration
function registerValidator(){

    // Define validation rules using express-validator middleware
    return [
        body("username").custom(async (value, ctx) => {
            if(value){
                // Regular expression for validating the username: starts with a lowercase letter, followed by lowercase letters, numbers, underscores, or periods.
                // Special characters as '!' '#' '@' are not allowed
                const usernameRegex = /^[a-z]+[a-z0-9\_\.]{3,}/gi

                if(usernameRegex.test(value)){
                    const user = await UserModel.findOne({username : value})
                    if(user) throw "username is duplicate"
                    return true
                }
                
                throw "this username isn't allowed"
            }
            else { throw "username shouldn't be empty" }
        }),

        body("email").isEmail().withMessage("this email is not allowed")
        .custom(async email => {
            const user = await UserModel.findOne({email})
            if(user) throw "email was used before";
            return true;
        }),

        body("mobile").isMobilePhone("da-DK").withMessage("this phone number isn't allowed")
        .custom(async mobile => {
            const user = await UserModel.findOne({mobile})
            if(user) throw "mobile phone was used before";
            return true;
        }),

        body("password").custom((value, ctx) => {
            if(!value) throw "password should't be empty";
         /*    if(value !== ctx?.req?.body?.confirm_password) throw "password is not the same"; */
            return true
        })/* ,
        body("confirm_password")
            .notEmpty()
            .withMessage("confirm_password shouldn't be empty") */
    ]

}


// Function for validating user login
function loginValidation(){

    // Define validation rules using express-validator middleware
    return [
        body("username").notEmpty().withMessage("username shouldn't be empty")

        .custom(username => {
            const usernameRegex = /^[a-z]+[a-z0-9\_\.]{3,}/gi
            if(usernameRegex.test(username)){
                return true
            }
            throw "wrong user name, please try again"
        }),

        body("password").isLength({min : 6, max : 16}).withMessage("The password should at least be between 6 and 16 characters")
    ]

}

module.exports = {
    registerValidator,
    loginValidation
}