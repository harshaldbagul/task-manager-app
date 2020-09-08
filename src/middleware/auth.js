const User = require("../models/user");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decodedToken._id,
      'tokens.token': token,
    });
    if (user) {
      req.user = user;
      req.token=token;
      next();
    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(401).send();
  }
};

module.exports = auth;
