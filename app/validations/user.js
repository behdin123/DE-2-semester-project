/**
 * This file exports a function that returns an array of Express validator middleware functions for validating images.
 * The array includes a validator for checking if the submitted file is an image with a valid format and size.
 */

const { body } = require("express-validator");
const path = require("path")

function imageValidator() {
    return [

        // Validator for checking if an image file was selected
        body("image").custom((value, {req}) => {
            if(!req.file || Object.keys(req.file).length == 0) throw "Please select an image"

            // Validator for checking if the image format is valid
            const ext = path.extname(req.file.originalname).toLowerCase();
            const exts = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
            if(!exts.includes(ext)) throw "The submitted format is not valid";
            
            // Validator for checking if the image size is within limits
            const maxSize = 2 * 2024*2024;
            if(req.file.size > maxSize) throw "The file size cannot be more than 4 megabytes"
            return true
        })
    ]
}

module.exports = {
    imageValidator
}