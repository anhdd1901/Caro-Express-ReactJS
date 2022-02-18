// Setup to use router - express
const express = require("express");
const SignUpRouter = express.Router();
module.exports = SignUpRouter;

// import controller
const signUpServices = require("../services/signUp");
const loginServices = require("../services/login");

// Main
SignUpRouter.post(
  "/",
  signUpServices.checkEmpty,
  signUpServices.checkExisted,
  signUpServices.checkUsernameValidate,
  signUpServices.checkPasswordValidate,
  signUpServices.signUp
);
