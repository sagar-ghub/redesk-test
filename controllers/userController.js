const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../services/sendEmail");
const config = require("../config/config");
const Organisation = require("../models/organisation");

exports.signup = (req, res) => {
  // Check whether email already exists
  const { email } = req.body;

  User.findOne({ email }, (err, email) => {
    if (err || email) {
      // console.log(err);
      return res
        .status(400)
        .send({ status: "400", message: "Email already exists" });
    }

    // If email don't exist, create user
    const user = new User(req.body);
    user.save((err, user) => {
      if (err) {
        return res.status(400).send({
          status: "500",
          message: "Unable to signup. Try again later",
          err,
        });
      }
      return res.status(201).send({
        status: "201",
        message: "Successfully added user",
        user: {
          id: user._id,
          role: user.role,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone_number: user.phone_number,
        },
      });
    });
  });
};
exports.signupwithorgs = async (req, res) => {
  // Check whether email already exists
  const { email, sub_domain } = req.body;

  const organisation = await Organisation.findOne({ sub_domain });
  if (!organisation) {
    return res.status(400).send({
      status: "400",
      message: "Organisation does not exist",
    });
  }

  User.findOne({ email, organisation: organisation._id }, (err, email) => {
    if (err || email) {
      // console.log(err);
      return res
        .status(400)
        .send({ status: "400", message: "Email already exists for orgs" });
    }

    // If email don't exist, create user
    req.body.organisation = organisation._id;
    const user = new User(req.body);
    user.save((err, user) => {
      if (err) {
        return res.status(400).send({
          status: "500",
          message: "Unable to signup. Try again later",
          err,
        });
      }
      return res.status(201).send({
        status: "201",
        message: "Successfully added user",
        user: {
          id: user._id,
          role: user.role,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone_number: user.phone_number,
          organisation: user.organisation,
        },
      });
    });
  });
};

exports.signin = (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .send({ status: "400", message: "Email does not exists" });
    }

    /**
     * @DESC Check Role Middleware
     */
    if (user.status === "approved") {
      if (!user.authenticate(password)) {
        return res.status(400).send({
          status: "400",
          message: "Email and password does not match",
        });
      }

      // create a token
      const token = jwt.sign(
        { _id: user._id, role: user.role, email: user.email },
        process.env.SECRET,
        { expiresIn: "100m" }
      );

      // Put token in cookie
      res.cookie("token", token);
      // Send response to front end
      // const { _id, name, email, role } = user
      return res.status(200).send({
        status: "200",
        user: {
          _id: user._id,
          role: user.role,
          firstname: user.firstName,
          lastname: user.lastName,
          email: user.email,
          pic: user.pic,
          token: `Bearer ${token}`,
        },
      });
    } else if (user.status === "pending") {
      return res
        .status(401)
        .send({ status: "401", message: "Account is not active yet" });
    } else if (user.status === "rejected") {
      return res.status(401).send({
        status: "401",
        message: "Your account is rejected by the admin",
      });
    }
  });
};
exports.signinwithorgs = (req, res) => {
  const { email, password, sub_domain } = req.body;

  User.findOne({ email })
    .populate("organisation")
    .exec((err, user) => {
      if (err || !user) {
        return res
          .status(400)
          .send({ status: "400", message: "Email does not exists" });
      }

      /**
       * @DESC Check Role Middleware
       */

      // let checkAuth=user.authenticate(password)
      // if(!checkAuth)
      // return res.
      if (user.status === "approved") {
        if (!user.authenticate(password)) {
          return res.status(400).send({
            status: "400",
            message: "Email and password does not match",
          });
        }
        if (sub_domain != user.organisation?.sub_domain)
          return res.status(400).send({
            status: "400",
            message: "Email and Organisation does not match",
          });

        // create a token
        const token = jwt.sign(
          {
            _id: user._id,
            role: user.role,
            email: user.email,
            organisation: user.organisation._id,
          },
          process.env.SECRET,
          { expiresIn: "100m" }
        );

        // Put token in cookie
        res.cookie("token", token);
        // Send response to front end
        // const { _id, name, email, role } = user
        return res.status(200).send({
          status: "200",
          user: {
            id: user._id,
            role: user.role,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            token: `Bearer ${token}`,
            organisation: user.organisation,
          },
        });
      } else if (user.status === "pending") {
        return res
          .status(401)
          .send({ status: "401", message: "Account is not active yet" });
      } else if (user.status === "rejected") {
        return res.status(401).send({
          status: "401",
          message: "Your account is rejected by the admin",
        });
      }
    });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).send({ status: "200", message: "User signout successful" });
};

exports.getUser = (req, res) => {
  const user = req.user;
  // console.log("asda" + req.io);

  // if (user.role === "admin") {
  if (true) {
    //not include role admin
    User.find(
      { role: { $ne: "admin" }, organisation: user.organisation },
      (err, docs) => {
        // User.find((err, docs) => {
        if (!err) {
          // req.io.emit("message", docs);
          // req.io.to("room2").emit("message", docs);
          res.status(200).send({ status: "200", message: "User List", docs });
        } else {
          return res.status(400).send({
            status: "400",
            message: "Failed to retrieve the User List: " + err,
          });
        }
      }
    );
  } else {
    res.status(400).send({
      status: 400,
      message: "Only admin can access this",
    });
  }
};

exports.getEmployeeList = (req, res) => {
  const user = req.user;
  // console.log("asda" + req.io);

  // if (user.role === "admin") {
  if (true) {
    //not include role admin
    User.find(
      {
        role: { $nin: ["admin", "team_leader", "observer"] },
        organisation: user.organisation,
      },
      (err, docs) => {
        // User.find((err, docs) => {
        if (!err) {
          // req.io.emit("message", docs);
          // req.io.to("room2").emit("message", docs);
          res.status(200).send({ status: "200", message: "User List", docs });
        } else {
          return res.status(400).send({
            status: "400",
            message: "Failed to retrieve the User List: " + err,
          });
        }
      }
    );
  } else {
    res.status(400).send({
      status: 400,
      message: "Only admin can access this",
    });
  }
};
exports.getTeamLeaderList = (req, res) => {
  const user = req.user;
  // console.log("asda" + req.io);

  // if (user.role === "admin") {
  if (true) {
    User.find(
      { role: "team_leader", organisation: user.organisation },
      (err, docs) => {
        if (!err) {
          // req.io.emit("message", docs);
          // req.io.to("room2").emit("message", docs);
          res
            .status(200)
            .send({ status: "200", message: "Team Leader List", docs });
        } else {
          return res.status(400).send({
            status: "400",
            message: "Failed to retrieve the User List: " + err,
          });
        }
      }
    );
  } else {
    res.status(400).send({
      status: 400,
      message: "Only admin can access this",
    });
  }
};
exports.getObserversList = (req, res) => {
  const user = req.user;
  // console.log("asda" + req.io);

  // if (user.role === "admin") {
  if (true) {
    User.find(
      { role: "observer", organisation: user.organisation },
      (err, docs) => {
        if (!err) {
          // req.io.emit("message", docs);
          // req.io.to("room2").emit("message", docs);
          res
            .status(200)
            .send({ status: "200", message: "Team Leader List", docs });
        } else {
          return res.status(400).send({
            status: "400",
            message: "Failed to retrieve the User List: " + err,
          });
        }
      }
    );
  } else {
    res.status(400).send({
      status: 400,
      message: "Only admin can access this",
    });
  }
};

exports.getLoginUser = (req, res) => {
  const user = req.user;

  // res.send(userDetails);
  const token = req.headers.authorization.split(" ")[1];

  return res.status(200).send({
    status: "200",
    user: {
      _id: user._id,
      role: user.role,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      pic: user.pic,
      token: `Bearer ${token}`,
    },
  });
};
exports.changeUserRoles = (req, res) => {
  const condition = { _id: req.params.id };
  const role = parseInt(req.body.role);

  if (role >= 3) {
    return res
      .status(400)
      .send({ status: "400", message: "Failed to user Update" });
  }
  let newRole = config.user_role[role];
  console.log(newRole);
  User.findOneAndUpdate(condition, { role: newRole })
    .then((docs) => {
      if (!docs) {
        return res
          .status(400)
          .send({ status: "400", message: "Failed to user Update" });
      }
      return res
        .status(200)
        .send({ status: "200", message: "Succesffully Updated User", docs });
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ status: "400", message: "Something went wrong", err });
    });
};

exports.userEdit = (req, res) => {
  const condition = { _id: req.params.id };
  if (req.body.role) {
    return res.status(400).send({ status: "400", message: "Cant update role" });
  }
  User.updateMany(condition, req.body)
    .then((docs) => {
      if (!docs) {
        return res
          .status(400)
          .send({ status: "400", message: "Failed to user Update" });
      }
      return res
        .status(200)
        .send({ status: "200", message: "Succesffully Updated User" });
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ status: "400", message: "Something went wrong", err });
    });
};

// Approve or reject user by the admin
exports.userApproveOrReject = async (req, res) => {
  const user = req.user;
  if (user.role === "admin") {
    try {
      const _id = req.params.id;
      const body = req.body.status;
      let status = "";
      status = config.user_status[body + ""];
      // if (body === 1) {
      //   status = "approved";
      // } else if (body === 0) {
      //   status = "rejected";
      // }
      const result = await User.findByIdAndUpdate(
        _id,
        {
          $set: { status },
        },
        { new: true }
      );
      if (body === 1) {
        return res
          .status(200)
          .send({ status: "200", message: "User signup approved" });
      } else if (body === 0) {
        return res
          .status(200)
          .send({ status: "200", message: "User signup rejected" });
      } else {
        return res
          .status(200)
          .send({ status: "200", message: "User signup Pending" });
      }
    } catch (err) {
      res.status(500).send({
        status: 500,
        message: "Error",
        err,
      });
    }
  } else {
    res.status(401).send({
      status: 401,
      message: "Only admin can access this",
    });
  }
};

exports.forgetPassword = (req, res) => {
  const email = req.body.email;

  User.findOne({ email })
    .then((docs) => {
      if (!docs) {
        return res
          .status(400)
          .send({ status: "400", message: "User not found" });
      }
      if (docs.status === "approved") {
        const userMail = docs.email;
        const sendUrl =
          "http://192.168.0.121:8001/api/resetPassword/" + docs._id;
        sendMail(userMail, sendUrl, res);
      } else {
        return res.status(401).send({
          status: "401",
          message: "You are not allowed to signIn",
        });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        status: "500",
        message: "Something went wrong. Try again later",
      });
    });
};

exports.inviteUser = (req, res) => {
  const userMail = req.body.email;
  const sendUrl = "http://192.168.0.121:8001/api/signup";
  sendMail(userMail, sendUrl, res);

  return res.status(401).send({
    status: "401",
    message: "You are not allowed to signIn",
  });
};

exports.allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
};
