// Setup to use router - express
const express = require("express");
const RoomRouter = express.Router();
module.exports = RoomRouter;

// import controller
const roomServices = require("../services/room");
const checkLogged = require("../services/login");

// Main
RoomRouter.get(
  "/",
  checkLogged.checkLogged,
  roomServices.checkAvailableFilter,
  roomServices.getRoomList
);
