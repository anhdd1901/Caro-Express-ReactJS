//  yarn add nodemon -D - setup auto save file JS (only for dev version)
const express = require("express");
const db = require("./dataBase/db");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Http server
const app = express();
const { createServer } = require("http");
const httpServer = createServer(app);

// Socket
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

// CORS
app.use(cors());

// install dot env
require("dotenv").config();

// Some var
const port = process.env.PORT;
const userList = db.get("userList").value();
const roomList = db.get("roomList").value();

// npm install body-parser --save - for install body-parser
const bodyParser = require("body-parser"); // Setup to use body-parse (read de-code request)
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// import router
const LoginRouter = require("./router/login.route");
const SignUpRouter = require("./router/signUp.route");
const RoomRouter = require("./router/room.route");

// Setup route
app.use("/", LoginRouter);
app.use("/sign-up", SignUpRouter);
app.use("/room", RoomRouter);

// Socket event

const checkSocketToken = (token) => {
  try {
    jwt.verify(token, process.env.TOKEN_SECRET);
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = userList.filter((a) => a.username === decoded.username);
    if (user.length !== 0) return true;
    else return false;
  } catch {
    return false;
  }
};

io.on("connection", (socket) => {
  if (checkSocketToken(socket.handshake.headers.auth)) {
    const decoded = jwt.verify(
      socket.handshake.headers.auth,
      process.env.TOKEN_SECRET
    );
    const user = userList.filter((a) => a.username === decoded.username)[0];

    // Enter online mode
    socket.on("enter-online-mode", () => {
      if (!roomList.some((a) => a.id === user.id)) {
        io.emit("new-room", {
          user: { ...user, password: null },
          socketRoomID: socket.id,
        });
        db.get("roomList")
          .push({
            id: user.id,
            socketRoomID: socket.id,
            playerOne: { ...user, password: null },
            playerTwo: null,
          })
          .write();
      }
    });

    // Leave online mode
    socket.on("leave-online-mode", () => {
      io.emit("delete-room", { idRoom: user.id });
      db.get("roomList").remove({ id: user.id }).write();
    });

    // Disconnect socket
    socket.on("disconnect", () => {
      io.emit("delete-room", { idRoom: user.id });
      db.get("roomList").remove({ id: user.id }).write();
    });

    // Send challenge
    socket.on(
      "send-challenge",
      (socketRoomID, challengerID, challengerSocketID) => {
        const challenger = userList.filter((a) => a.id === challengerID)[0];
        io.to(socketRoomID).emit("receive-challenge", {
          socketRoomID: socketRoomID,
          challenger: challenger,
          challengerSocketID: challengerSocketID,
        });
      }
    );

    // Refuse challenge
    socket.on("refuse-challenge", (challengerSocketID) => {
      io.to(challengerSocketID).emit("receive-refuse-challenge");
    });

    // Decline challenge
    socket.on("decline-challenge", (challengerSocketID) => {
      io.to(challengerSocketID).emit("receive-decline-challenge");
    });

    // Accept challenge
    socket.on(
      "accept-challenge",
      (challengerSocketID, roomSocketID, challengerID) => {
        const challenger = userList.filter((a) => a.id === challengerID)[0];
        io.to(challengerSocketID).emit(
          "receive-accept-challenge",
          roomSocketID
        );

        db.get("roomList").remove({ socketRoomID: challengerSocketID }).write();
        db.get("roomList")
          .find({ socketRoomID: roomSocketID })
          .assign({ playerTwo: { ...challenger, password: null } })
          .write();
        io.emit("one-room-full", challengerSocketID, roomSocketID);
      }
    );
  } else {
    socket.disconnect(true);
  }
});

// Show port number
httpServer.listen(port, () => {
  console.log(`This port is ${port}`);
});
