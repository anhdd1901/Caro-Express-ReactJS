// Create DB
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./dataBase/db.json");
const db = low(adapter);
db.defaults({ userList: [] }).write();
db.defaults({ roomList: [] }).write();

module.exports = db;
