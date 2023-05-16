const nodemailer = require("nodemailer");

exports.sendMail = (userMail, sendUrl, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "subhadev1289@gmail.com",
      pass: "yzchxkbxrizezpet",
    },
  });

  const obj = {
    message: "To reset your password click on the link",
    link: sendUrl,
  };

  const mailOptions = {
    from: "subhadev1289@gmail.com",
    to: userMail,
    subject: "This is the subject",
    text: `${obj.message}\n${obj.link}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return res.status(500).send({
        status: 500,
        message: "Mail send unsuccessful",
      });
    } else {
      return res.status(200).send({
        status: 200,
        message: "Mail send successfully",
      });
    }
  });
};
