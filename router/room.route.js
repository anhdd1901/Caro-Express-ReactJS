// Setup to use router - express
const express = require("express");
const RoomRouter = express.Router();

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

RoomRouter.get(
  "/user/:id",
  checkLogged.checkLogged,
  roomServices.checkUserID,
  roomServices.getUserInfo
);

module.exports = RoomRouter;
