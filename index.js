let Application = require("./app/server");
require("dotenv").config();
const PORT = process.env.PORT;
const DB_URL = process.env.DB_URL;
Application = new Application(PORT, DB_URL)

module.exports = Application;