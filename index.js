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

// Check socket token
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

// Table size
const tableSize = process.env.TABLE_SIZE;

// Default table
const DEFAULT_TABLE = Array.from({ length: tableSize }, () =>
  Array.from({ length: tableSize }, () => "")
);

// Setup new move
const onMove = (
  rowIndex,
  colIndex,
  playingRoomID,
  yourSymbol,
  opponentSocketID,
  socket
) => {
  const room = db.get("roomList").find({ id: playingRoomID }).value();
  const currentGameArray = room.table ? [...room.table] : [...DEFAULT_TABLE];
  if (!currentGameArray[rowIndex][colIndex]) {
    currentGameArray[rowIndex][colIndex] = yourSymbol;

    checkWin(
      rowIndex,
      colIndex,
      currentGameArray,
      yourSymbol,
      opponentSocketID,
      socket,
      playingRoomID
    );
  }
};

// Kinds of win-checker
const KINDS_OF_WIN_CHECKER = [
  // Row
  [
    [1, 0],
    [-1, 0],
  ],
  // Col
  [
    [0, 1],
    [0, -1],
  ],
  // Dash
  [
    [1, 1],
    [-1, -1],
  ],
  // Slash
  [
    [1, -1],
    [-1, 1],
  ],
];

// Check win
const checkWin = (
  rowIndex,
  colIndex,
  currentGameArray,
  currentTurn,
  opponentSocketID,
  socket,
  playingRoomID
) => {
  let totalWinStraight = [];
  let gameOver = false;

  KINDS_OF_WIN_CHECKER.forEach((kindOfWinChecker) => {
    let winStraight = [[rowIndex, colIndex]];

    kindOfWinChecker.forEach((checkFlow) => {
      let movingRowIndex = rowIndex;
      let movingColIndex = colIndex;

      while (
        movingRowIndex + checkFlow[0] >= 0 &&
        movingColIndex + checkFlow[1] >= 0 &&
        movingRowIndex + checkFlow[0] < tableSize &&
        movingColIndex + checkFlow[1] < tableSize
      ) {
        movingRowIndex += checkFlow[0];
        movingColIndex += checkFlow[1];
        if (currentGameArray[movingRowIndex][movingColIndex] === currentTurn) {
          winStraight = [...winStraight, [movingRowIndex, movingColIndex]];
        } else break;
      }
    });

    if (winStraight.length >= 5) {
      gameOver = true;
      totalWinStraight = [...totalWinStraight, ...winStraight];
    }
  });

  if (gameOver) {
    console.log("done");
    db.get("roomList")
      .find({ id: playingRoomID })
      .assign({ table: null })
      .write();

    io.to(opponentSocketID).emit(
      "opponent-win",
      rowIndex,
      colIndex,
      currentGameArray,
      totalWinStraight
    );
    io.to(socket.id).emit("you-win", totalWinStraight);
  } else {
    console.log("continue");
    db.get("roomList")
      .find({ id: playingRoomID })
      .assign({ table: currentGameArray })
      .write();

    io.to(opponentSocketID).emit(
      "opponent-move",
      rowIndex,
      colIndex,
      currentGameArray
    );
  }
};

// Socket event
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
          table: DEFAULT_TABLE,
        });
        db.get("roomList")
          .push({
            id: user.id,
            socketRoomID: socket.id,
            playerOne: { ...user, password: null },
            playerTwo: null,
            table: null,
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
      (challengerSocketID, roomSocketID, challengerID, roomID) => {
        const challenger = userList.filter((a) => a.id === challengerID)[0];
        io.to(challengerSocketID).emit(
          "receive-accept-challenge",
          roomSocketID,
          roomID
        );

        db.get("roomList").remove({ socketRoomID: challengerSocketID }).write();
        db.get("roomList")
          .find({ socketRoomID: roomSocketID })
          .assign({ playerTwo: { ...challenger, password: null } })
          .write();
        io.emit("one-room-full", challengerSocketID, roomSocketID);
      }
    );

    // On move
    socket.on(
      "on-move",
      (opponentSocketID, playingRoomID, rowIndex, colIndex, yourSymbol) => {
        onMove(
          rowIndex,
          colIndex,
          playingRoomID,
          yourSymbol,
          opponentSocketID,
          socket
        );
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
