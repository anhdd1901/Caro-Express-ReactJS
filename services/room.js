// import database
const db = require("../dataBase/db");
const roomList = db.get("roomList").value();

const ROOM_TAB_LIST = ["all", "waiting", "playing"];

module.exports.checkAvailableFilter = (req, res, next) => {
  if (req.query.filter.trim()) {
    const filter = req.query.filter;
    console.log(filter);
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
  else res.json(roomList.filter((a) => a.status === req.query.filter));
};
