// import database
const db = require("../dataBase/db");
const userList = db.get("userList").value();

// Create random string
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

  res.json({ token: token });
};

module.exports.checkLogged = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    userList.some(
      (a) =>
        a.username === decoded.username &&
        bcrypt.compareSync(decoded.password, a.password)
    );
    next();
  } catch (err) {
    console.log("Error!!!", err);
    res.json({ errorMess: "Please login" });
  }
};
