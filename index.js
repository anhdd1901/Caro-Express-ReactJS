//  yarn add nodemon -D - setup auto save file JS (only for dev version)
const express = require("express");
const app = express();

// install dot env
require("dotenv").config();

const port = process.env.PORT;

// npm install body-parser --save - for install body-parser
const bodyParser = require("body-parser"); // Setup to use body-parse (read de-code request)
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// import router
const LoginRouter = require("./router/login.route");
const SignUpRouter = require("./router/signUp.route");
const RoomRouter = require("./router/room.route");

// Import middleware
const checkLogged = require("./services/login");

// Setup route
app.use("/", LoginRouter);
app.use("/sign-up", SignUpRouter);
app.use("/room", RoomRouter);

// Show port number
app.listen(port, () => {
  console.log(`This port is ${port}`);
});
