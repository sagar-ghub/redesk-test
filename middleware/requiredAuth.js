const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.requiredAuth = async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    return res
      .status(422)
      .send({ status: "422", message: "Please provide the token" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).send({ status: "401", message: "Unauthorized!" });
    }

    // get user details using token
    const _id = decoded._id;
    // console.log(_id);
    const result = await User.findById(_id);

    if (!result) {
      return res.status(401).send({ status: "401", message: "Unauthorized!" });
    }

    // console.log(result);
    req.user = result;

    next();
  });
};
