// Setup to use router - express
const express = require("express");
const LoginRouter = express.Router();
module.exports = LoginRouter;

// import controller
const loginServices = require("../services/login");

// Main
LoginRouter.post(
  "/log-in",
  loginServices.checkEmpty,
  loginServices.checkValid,
  loginServices.login
);

LoginRouter.post("/auth", loginServices.keepLoginning);
