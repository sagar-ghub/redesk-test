const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../services/sendEmail");
const config = require("../config/config");
const Organisation = require("../models/organisation");
const crypto = require("crypto");
const uuidv1 = require("uuid/v1");

exports.createOrganisation = async (req, res) => {
  // Check whether email already exists
  const {
    sub_domain,
    organisation_name,
    organisation_email,
    organisation_website,
    organisation_address,
  } = req.body;

  const result = await User.findOne({ email: req.body.email });
  if (result) {
    return res.status(400).send({
      status: "400",
      message: "Email already exists",
    });
  }

  Organisation.findOne({ sub_domain }, (err, org) => {
    if (err || org) {
      // console.log(err);
      return res
        .status(400)
        .send({ status: "400", message: "Company subdomain already exists" });
    }

    // If email don't exist, create user
    req.body.status = "approved";
    req.body.role = "admin";
    const organisation = new Organisation(req.body);
    organisation.save((err, organisation) => {
      if (err) {
        return res.status(400).send({
          status: "500",
          message: "Unable to signup. Try again later",
          err,
        });
      }

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
          message: "Successfully added Organisation",
          organisation: {
            id: organisation._id,
            sub_domain: organisation.sub_domain,
            organisation_name: organisation.organisation_name,
          },
        });
      });
    });
  });
};
exports.checkSubDomain = (req, res) => {
  const { sub_domain } = req.body;
  Organisation.findOne({ sub_domain }, (err, subdomain) => {
    if (err || subdomain) {
      // console.log(err);
      return res
        .status(400)
        .send({ status: "400", message: "Subdomain already exists" });
    }
    return res.status(201).send({
      status: "201",
      message: "Subdomain is available",
    });
  });
};

exports.sendInviteFromOrganisation = async (req, res) => {
  const user = req.user;

  const { email_arr } = req.body;

  const organisation = await Organisation.findOne({ _id: user.organisation });
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "subhadev1289@gmail.com",
      pass: "yzchxkbxrizezpet", // naturally, replace both with your real credentials or an application-specific password
    },
  });

  transporter.sendMail({
    from: "subhadev1289@gmail.com",
    to: email_arr,
    subject: "Please set up your account for Redesk",
    text: `Please click on the link to set up your account for ${organisation.organisation_name} at Redesk https://redesk.in/${organisation.sub_domain}/signup`,
  });

  return res.status(201).send({
    status: "201",
    message: "Successfully sent invites",
  });
};

// let final_arr = [],
//   promises = [];
// for (let i = 0; i < email_arr.length; i++) {
//   let pass = Math.random().toString(36).slice(2, 10);

//   const mailOptions = {
//     from: "subhadev1289@gmail.com",
//     to: email_arr[i].email,
//     subject: "Your Account is up for Redesk",
//     text: `Your password is ${pass}`,
//   };

//   let salt = uuidv1();
//   let encry_password = "";
//   try {
//     encry_password = crypto
//       .createHmac("sha256", salt)
//       .update(pass + "")
//       .digest("hex");
//   } catch (e) {
//     console.log(e);
//     encry_password = "";
//   }
//   final_arr.push({
//     firstName: email_arr[i].firstName,
//     lastName: email_arr[i].lastName,
//     email: email_arr[i].email,
//     salt: salt,
//     encry_password: encry_password,
//     organisation: organisation_id,
//   });

//   promises.push(
//     new Promise(function (resolve, reject) {
//       transporter.sendMail(mailOptions, function (err, info) {
//         if (err) {
//           reject(err);
//         } else resolve(info);
//       });
//     })
//   );
// }
// console.log(final_arr);
// const user = await User.insertMany(final_arr, { upsert: true });
// console.log(user);
// const mailOptions2 = {
//   from: "user@gmail.com",
//   to: "test1@gmail.com",
//   subject: "LOL due",
//   text: "Dudes, we really need your money.",
// };

// Promise.all(promises)
//   .then((r) => {
//     return res.status(201).send({
//       status: "201",
//       message: "Invite Sent",
//       data: r,
//     });
//   })
//   .catch((err) =>
//     res.status(201).send({
//       status: "500",
//       message: "Something went wrong",
//       error: err,
//     })
//   );
// };

//organisation list

exports.getOrganisationList = (req, res) => {
  Organisation.find({}, (err, orgs) => {
    if (orgs) {
      // console.log(err);
      return res
        .status(201)
        .send({ status: "201", message: "orgs list", data: orgs });
    }
    return res.status(400).send({
      status: "400",
      message: "Orgs is not available",
    });
  });
};
