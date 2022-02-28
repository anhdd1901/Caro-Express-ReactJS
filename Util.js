const db = require("./dataBase/db");

// Table size
const tableSize = process.env.TABLE_SIZE;

// Default table
const DEFAULT_TABLE = Array.from({ length: tableSize }, () =>
  Array.from({ length: tableSize }, () => "")
);

// Setup new move
module.exports.onMove = (
  rowIndex,
  colIndex,
  playingRoomID,
  yourSymbol,
  opponentSocketID,
  socket,
  io
) => {
  const room = db.get("roomList").find({ id: playingRoomID }).value();
  let Xmove = [...room.Xmove];
  let Omove = [...room.Omove];
  if (yourSymbol === "x") Xmove = [...Xmove, [rowIndex, colIndex]];
  else Omove = [...Omove, [rowIndex, colIndex]];

  checkWin(
    rowIndex,
    colIndex,
    Xmove,
    Omove,
    yourSymbol,
    opponentSocketID,
    socket,
    playingRoomID,
    io
  );
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
  Xmove,
  Omove,
  currentTurn,
  opponentSocketID,
  socket,
  playingRoomID,
  io
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
        if (
          (currentTurn === "x" &&
            Xmove.some((a) => {
              return (
                JSON.stringify(a) ===
                JSON.stringify([movingRowIndex, movingColIndex])
              );
            })) ||
          (currentTurn === "o" &&
            Omove.some((a) => {
              return (
                JSON.stringify(a) ===
                JSON.stringify([movingRowIndex, movingColIndex])
              );
            }))
        )
          winStraight = [...winStraight, [movingRowIndex, movingColIndex]];
        else break;
      }
    });

    if (winStraight.length >= 5) {
      gameOver = true;
      totalWinStraight = [...totalWinStraight, ...winStraight];
    }
  });

  if (gameOver) {
    const room = db.get("roomList").find({ id: playingRoomID }).value();
    db.get("roomList")
      .find({ id: playingRoomID })
      .assign({
        Xmove: [],
        Omove: [],
        playerOne: {
          ...room.playerOne,
          currentWon:
            room.playerOne.currentWon + Number(currentTurn === "x" ? 1 : 0),
        },
        playerTwo: {
          ...room.playerTwo,
          currentWon:
            room.playerTwo.currentWon + Number(currentTurn === "o" ? 1 : 0),
        },
      })
      .write();

    io.to(opponentSocketID).emit(
      "opponent-win",
      rowIndex,
      colIndex,
      Xmove,
      Omove,
      totalWinStraight
    );
    io.to(socket.id).emit("you-win", totalWinStraight);
    io.emit("update-playing-room", playingRoomID, currentTurn);
  } else {
    db.get("roomList")
      .find({ id: playingRoomID })
      .assign({ Xmove: Xmove, Omove: Omove })
      .write();

    io.to(opponentSocketID).emit(
      "opponent-move",
      rowIndex,
      colIndex,
      Xmove,
      Omove
    );
  }
};
