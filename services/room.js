// import database
const db = require("../dataBase/db");
const roomList = db.get("roomList").value();

const ROOM_TAB_LIST = ["all", "waiting", "playing"];

module.exports.checkAvailableFilter = (req, res, next) => {
  if (req.query.filter.trim()) {
    const filter = req.query.filter;
    if (ROOM_TAB_LIST.some((a) => a === filter)) {
      next();
    } else {
      res.json({ errorMess: "Wrong query: filter" });
    }
  } else {
    res.json({ errorMess: "Wrong query: filter" });
  }
};

module.exports.getRoomList = (req, res, next) => {
  if (req.query.filter === "all") res.json(roomList);
  else if (req.query.filter === "waiting")
    res.json(roomList.filter((a) => !a.playerTwo));
  else res.json(roomList.filter((a) => a.playerTwo));
};

module.exports.checkUserID = (req, res, next) => {
  const user = db.get("userList").find({ id: req.params.id }).value();
  if (!user) {
    res.json({ errorMess: "User was not found" });
  } else next();
};

module.exports.getUserInfo = (req, res, next) => {
  const user = db.get("userList").find({ id: req.params.id }).value();
  res.json({ user: user });
};
