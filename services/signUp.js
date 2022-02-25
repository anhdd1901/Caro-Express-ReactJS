// import database
const db = require("../dataBase/db");
const userList = db.get("userList").value();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { v4: uuidv4 } = require("uuid");
const specialChars = "!@#$%^&*()";

module.exports.checkEmpty = (req, res, next) => {
  if (!req.body.username.trim() || !req.body.password.trim()) {
    res.json({
      errorMess:
        !req.body.username.trim() && !req.body.password.trim()
          ? "Please type your username & password"
          : !req.body.username.trim()
          ? "Please type your username"
          : "Please type your password",
    });
  } else next();
};

const checkPasswordLength = (password) => {
  return password.length >= 8;
};

const checkUsernameLength = (username) => {
  return username.length >= 8 && username.length <= 10;
};

const checkUsernameNotContainSpace = (username) => {
  return !username.split("").some((a) => a.charCodeAt() === 32);
};

const checkPasswordContainUpperCase = (password) => {
  return password
    .split("")
    .some((a) => a.charCodeAt() >= 65 && a.charCodeAt() <= 90);
};

const checkPasswordContainLowerCase = (password) => {
  return password
    .split("")
    .some((a) => a.charCodeAt() >= 97 && a.charCodeAt() <= 122);
};

const checkPasswordContainSpecialChar = (password) => {
  return password.split("").some((a) => specialChars.indexOf(a) >= 0);
};

const checkPasswordContainNumericChar = (password) => {
  return password
    .split("")
    .some((a) => a.charCodeAt() >= 48 && a.charCodeAt() <= 57);
};

const checkPasswordSummaryValidate = (password) => {
  return (
    checkPasswordLength(password) &&
    (checkPasswordContainUpperCase(password) ||
      checkPasswordContainLowerCase(password)) &&
    checkPasswordContainNumericChar(password) &&
    checkPasswordContainSpecialChar(password)
  );
};

const checkUsernameSummaryValidate = (username) => {
  return (
    checkUsernameLength(username) && checkUsernameNotContainSpace(username)
  );
};

module.exports.checkUsernameValidate = (req, res, next) => {
  if (!checkUsernameSummaryValidate(req.body.username)) {
    res.json({
      errorMess: "Username must be from 8 to 10 characters & without space",
    });
  } else next();
};

module.exports.checkPasswordValidate = (req, res, next) => {
  if (!checkPasswordSummaryValidate(req.body.password)) {
    res.json({
      errorMess:
        "Password must be at least 8 characters including 01 numeric character & 01 special character",
    });
  } else next();
};

module.exports.checkExisted = (req, res, next) => {
  const existed = userList.some((a) => a.username === req.body.username);

  if (existed) {
    res.json({
      errorMess: "This username is already existed",
    });
  } else next();
};

module.exports.signUp = (req, res) => {
  // Hash password
  const hash = bcrypt.hashSync(req.body.password.toLowerCase(), saltRounds);

  db.get("userList")
    .push({
      username: req.body.username.toLowerCase(),
      password: hash,
      id: uuidv4(),

      displayName: req.body.username.toLowerCase().slice(0, 6),
      avatar: "",
      rank: 1,
      gamePlayed: 0,
      gameWon: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      currentWon: 0,
    })
    .write();

  res.json({ errorMess: "" });
};
