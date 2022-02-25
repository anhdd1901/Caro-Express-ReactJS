// import database
const db = require("../dataBase/db");
const userList = db.get("userList").value();

// Create/check token
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

module.exports.checkValid = (req, res, next) => {
  const validUser = userList.some(
    (a) =>
      a.username === req.body.username &&
      bcrypt.compareSync(req.body.password, a.password) // Check hash pass
  );

  if (!validUser) {
    res.json({
      errorMess: "Invalid username & password",
    });
  } else next();
};

module.exports.login = (req, res) => {
  const token = jwt.sign(
    { username: req.body.username, password: req.body.password },
    process.env.TOKEN_SECRET,
    {
      expiresIn: process.env.TOKEN_EXPIRED_TIME,
    }
  );
  const user = userList.filter((a) => a.username === req.body.username);

  res.json({ token: token, username: req.body.username, userID: user[0].id });
};

const checkToken = (token) => {
  return token[0] === "Bearer";
};

module.exports.checkLogged = (req, res, next) => {
  const token = req.headers.authorization.split(" ");
  if (checkToken(token)) {
    try {
      jwt.verify(token[1], process.env.TOKEN_SECRET);
      const decoded = jwt.verify(token[1], process.env.TOKEN_SECRET);
      userList.some(
        (a) =>
          a.username === decoded.username &&
          bcrypt.compareSync(decoded.password, a.password)
      );
      next();
    } catch (err) {
      console.log("Error!!!", err);
      res.json({ errorMess: "Login and chill !!!" });
    }
  }
};

module.exports.keepLoginning = (req, res) => {
  const token = req.headers.authorization.split(" ");
  if (checkToken(token)) {
    try {
      jwt.verify(token[1], process.env.TOKEN_SECRET);
      const decoded = jwt.verify(token[1], process.env.TOKEN_SECRET);
      userList.some(
        (a) =>
          a.username === decoded.username &&
          bcrypt.compareSync(decoded.password, a.password)
      );
      const user = userList.filter((a) => a.username === decoded.username);
      res.json({ username: decoded.username, userID: user[0].id });
    } catch (err) {
      console.log("Error!!!", err);
      res.json({ errorMess: "Login and chill !!!" });
    }
  }
};